// @flow
const { getEnvironment } = require("./../utils");

const { SUPPORTED_IMAGES, SUPPORTED_TRANSFORMABLE_IMAGES, getImageKey } = require("./utils");

export default {
    canProcess: ({ extension }) => {
        return SUPPORTED_IMAGES.includes(extension);
    },
    async process({ s3, key, extension }) {
        console.log("hocu deleteati");
        console.log(s3);
        console.log(key);
        console.log(extension);
        console.log("------");
    }
};
