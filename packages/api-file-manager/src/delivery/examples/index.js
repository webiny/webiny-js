#!/usr/bin/env node

const pyramid = require("./pyramid");

const handler = async (event, _context, _callback) => {
    const bucket = event["Records"][0]["s3"]["bucket"]["name"];
    const key = event["Records"][0]["s3"]["object"]["key"];
    const file_extension = key.split(".").pop();

    const allowed_file_extension = ["jpeg", "jpg"];
    //Check if the image is a resized version and file type is allowed.
    if (
        key.startsWith("img") ||
        !allowed_file_extension.includes(file_extension) ||
        !allowed_file_extension.includes(file_extension)
    ) {
        console.log(
            "The image was not processed. Either the image is a resized version or the file type is not valid"
        );
        return false;
    }

    const source = `s3://${bucket}/${key}`;
    const target = `s3://${bucket}/${key.split(".")[0]}.tif`;

    return await pyramid.createPyramidTiff(source, target);
};

module.exports = { handler };
