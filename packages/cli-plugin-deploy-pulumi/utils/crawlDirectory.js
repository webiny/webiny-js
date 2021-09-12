const fs = require('fs');

const crawlDirectory = (dir, callback)  => {
    if (!fs.existsSync(dir)) {
        return;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            crawlDirectory(filePath, callback);
        }
        if (stat.isFile()) {
            callback(filePath);
        }
    }
}

module.exports = crawlDirectory;
