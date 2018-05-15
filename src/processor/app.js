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

async function processCameras() {
  for (let camera of config.cameras) {
    const darknetPath = config.darknetPath;
    console.log('Processing camera');
    console.log(camera);

    const imagePath = path.resolve(config.tempImagesFolder, `${camera.id}.jpg`);
    await downloadIMG(camera.url, imagePath);

    const stdOut = cp.execFileSync(
      `${darknetPath}/darknet`,
      ['detector', 'test', `cfg/coco.data`, `cfg/yolov3.cfg`, 'yolov3.weights', imagePath, '-thresh 0.1'],
      {
        cwd: darknetPath,
        encoding: 'utf8'
      }
    );

    const predictionsOrigPath = path.resolve(darknetPath, `predictions.png`);
    const predictionsDestPath = path.resolve(config.tempImagesFolder, `predictions-${camera.id}.png`);
    fs.copySync(predictionsOrigPath, predictionsDestPath);

    let output = stdOut.toString();
    const peopleCount = (output.match(/person/g) || []).length;
    console.log(output);
    console.log(`FOUND: ${peopleCount} people`);
    db.set(camera.id, peopleCount)
      .write();
  }
}

function loop(myPromise) {
  return myPromise().then(() => {
    loop(myPromise)
  })
}

loop(processCameras);

// console.log(config);