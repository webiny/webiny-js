// @flow
const S3 = require("aws-sdk/clients/s3");
const { getEnvironment } = require("../utils");
const path = require("path");

const managers = require("./../managers");

module.exports.handler = async event => {
    const keys = [];
    for (let i = 0; i < event.Records.length; i++) {
        let record = event.Records[i];
        keys.push(record.s3.object);
    }

    const { region } = getEnvironment();
    const s3 = new S3({ region });

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        const extension = path.extname(key);

        for (let j = 0; j < managers.length; j++) {
            let manager = managers[j];
            const canProcess = manager.canProcess({
                s3,
                key,
                extension
            });

            if (canProcess) {
                await manager.process({
                    s3,
                    key,
                    extension
                });
            }
        }
    }
};
