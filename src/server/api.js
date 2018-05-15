import express from 'express';
import fs from 'fs';
const app = express();

// INIT DB
// DB INIT
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.get('/cameras', function(req, res){
  const adapter = new FileSync(config.dbFile);
  const db = low(adapter);
  res.json(db.getState());
});

console.log('listening to port 3000. Endpoint: /cameras');
app.listen(3000);
