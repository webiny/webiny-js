const AWS = require("aws-sdk");
const concat = require("concat-stream");
const sharp = require("sharp");
const URI = require("uri-js");
const s3 = new AWS.S3();

AWS.config.update({ httpOptions: { timeout: 6000 } });

const createPyramidTiff = (source, dest) => {
    return new Promise((resolve, reject) => {
        try {
            console.log(`Creating pyramid from ${source}`);
            const inputStream = streamFromS3(source);

            let metadata;
            const transformStream = sharp({
                limitInputPixels: false,
                sequentialRead: true
            })
                .removeAlpha()
                .resize({
                    width: 15000,
                    height: 15000,
                    fit: "inside",
                    withoutEnlargement: true
                })
                .rotate()
                .tiff({
                    compression: "jpeg",
                    quality: 75,
                    tile: true,
                    tileHeight: 256,
                    tileWidth: 256,
                    pyramid: true
                })
                .withMetadata()
                .toFormat("tif")
                .on("info", info => (metadata = info));

            const uploadStream = concat(data => {
                console.log(`Saving to ${dest}`);
                uploadToS3(data, dest, metadata)
                    .then(result => resolve(result))
                    .catch(err => reject(err));
            });

            inputStream.pipe(transformStream).pipe(uploadStream);
        } catch (err) {
            reject(err);
        }
    });
};

const streamFromS3 = location => {
    let uri = URI.parse(location);
    return s3.getObject({ Bucket: uri.host, Key: getS3Key(uri) }).createReadStream();
};

const uploadToS3 = (data, location, { width, height }) => {
    let uri = URI.parse(location);
    return new Promise((resolve, reject) => {
        s3.upload(
            {
                Bucket: uri.host,
                Key: getS3Key(uri),
                Body: data,
                Metadata: { width: width.toString(), height: height.toString() }
            },
            (err, _data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(location);
                }
            }
        );
    });
};

const getS3Key = uri => {
    return uri.path.replace(/^\/+/, "");
};

module.exports = { createPyramidTiff };
