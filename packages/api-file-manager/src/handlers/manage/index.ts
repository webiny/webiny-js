import path from "path";
import S3 from "aws-sdk/clients/s3";
import { getEnvironment } from "../utils";
import managers from "../transform/managers";
import { S3EventHandler } from "@webiny/handler-aws";

/**
 * This handler must be run through @webiny/handler-aws/s3
 */
export const createManageFilePlugins = () => {
    return [
        new S3EventHandler(async ({ event }) => {
            const keys: string[] = [];
            for (let i = 0; i < event.Records.length; i++) {
                const record = event.Records[i];
                if (typeof record.s3.object.key === "string") {
                    keys.push(record.s3.object.key);
                }
            }

            if (keys.length === 0) {
                return;
            }

            const { region } = getEnvironment();
            const s3 = new S3({ region });

            for (const key of keys) {
                const extension = path.extname(key);

                for (const manager of managers) {
                    const canProcess = manager.canProcess({
                        key,
                        extension
                    });

                    if (!canProcess) {
                        continue;
                    }
                    await manager.process({
                        s3,
                        key,
                        extension
                    });
                }
            }
        })
    ];
};
