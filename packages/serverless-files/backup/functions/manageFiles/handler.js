const S3 = require("aws-sdk/clients/s3");
const { getEnvironment } = require("../utils");
const path = require("path");

const managers = require("./../managers");

module.exports.handler = async event => {
    const keys = [];
    for (let i = 0; i < event.Records.length; i++) {
        const record = event.Records[i];
        if (typeof record.s3.object.key === "string") {
            keys.push(record.s3.object.key);
        }
    }

    const { region } = getEnvironment();
    const s3 = new S3({ region });

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const extension = path.extname(key);

        for (let j = 0; j < managers.length; j++) {
            const manager = managers[j];
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
