import fs from 'fs-extra';
import path from 'path';
import cp from 'child_process';
import download from 'image-downloader';

// DB INIT
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const adapter = new FileSync(config.dbFile);
const db = low(adapter);

db.defaults({});

console.log(__dirname);

async function downloadIMG(url, dest) {
  try {
    const { filename, image } = await download.image({
      url, dest
    })
    console.log(filename, image) // => /path/to/dest/image.jpg
  } catch (e) {
    throw e
  }
}


const cameras = config.cameras;
const darknetPath = config.darknetPath;
const darknet = cp.spawn(
  `${darknetPath}/darknet`,
  ['detector', 'test', `cfg/coco.data`, `cfg/yolov3.cfg`, 'yolov3.weights'],
  {
    cwd: darknetPath,
    encoding: 'utf8'
  }
);

let totalCams = cameras.length;

async function processCamera(i) {
  const camera = cameras[i];
  console.log(camera);
  const imagePath = path.resolve(config.tempImagesFolder, `${camera.id}.jpg`);
  await downloadIMG(camera.url, imagePath);
  console.log(imagePath)
  darknet.stdin.write(imagePath)
  darknet.stdin.write('\n')
}

let i = 0;
let firstRun = true;

darknet.stdout.on('data', async data => {
  let output = data.toString();

  // Process first camera
  if (output.indexOf('Enter Image Path:') !== -1 && firstRun) {
    firstRun = false;
    await processCamera(i);
  }

  // Process other cameras after first
  if (output.indexOf('Predicted in') !== -1) {

    const camera = cameras[i];
    console.log('RESULTS COMING IN')
    console.log(camera);
    console.log(output);
    const predictionsOrigPath = path.resolve(darknetPath, `predictions.png`);
    const predictionsDestPath = path.resolve(config.tempImagesFolder, `predictions-${camera.id}.png`);
    fs.copySync(predictionsOrigPath, predictionsDestPath);
    const peopleCount = (output.match(/person/g) || []).length;
    console.log(`FOUND: ${peopleCount} people`);
    db.set(camera.id, peopleCount)
      .write();
    i++;
    if (totalCams === i) {
      i = 0;
    }
    await processCamera(i);
  }
})


darknet.stderr.on('data', data => {
  console.log(data.toString())
})


// processCameras();

// function loop(myPromise) {
//   return myPromise().then(() => {
//     loop(myPromise)
//   })
// }
//
// loop(processCameras);

// console.log(config);