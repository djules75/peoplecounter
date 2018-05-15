# Install darknet

```bash
https://pjreddie.com/darknet/yolo/
```

Don't forget to download and install the weights for the model
```
https://pjreddie.com/media/files/yolov3.weights
```

And save them in at the root of the darknet folder

# Install project dependencies

```bash
npm install
```

# Configure project

Edit `config.json` with appropriate values.

- `darknetPath`: absolute path to the darknet executable
- `tempImagesFolder`: absolute path where images retrieved from cameras are stored
- `dbFile`: absolute path to the .json database file where people counts are stored
- `cameras`: array of camera entries. `id` and `url` of the camera still image are required

# 1. Launch image processor

```bash
npm start
```

# 2. Launch API server
```bash
npm run serve
```

API endpoint to see results:
- `http://localhost:3000/cameras`
