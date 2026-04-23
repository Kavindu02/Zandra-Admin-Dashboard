const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, '../data');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const file = fs.createWriteStream(path.join(dir, 'airports.json'));

https.get('https://raw.githubusercontent.com/algolia/datasets/master/airports/airports.json', function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Airports downloaded successfully!');
  });
}).on('error', function(err) {
  fs.unlink(path.join(dir, 'airports.json'));
  console.error('Error downloading airports: ' + err.message);
});
