const sharp = require("sharp");

const optimizeImage = async (buffer, type) => {
    switch (type) {
        case "image/png": {
            return await sharp(buffer)
                .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
                .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
                .withMetadata()
                .toBuffer();
        }
        case "image/jpeg":
        case "image/jpg": {
            return await sharp(buffer)
                .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
                .toFormat("jpeg", { quality: 90 })
                .toBuffer();
        }
        default:
            return buffer;
    }
};

export default optimizeImage;
