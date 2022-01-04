import path from "path";
import S3 from "aws-sdk/clients/s3";
import { HandlerPlugin } from "@webiny/handler/types";
import { createHandler, getEnvironment } from "../utils";
import managers from "../transform/managers";
import { ArgsContext } from "@webiny/handler-args/types";

export default (): HandlerPlugin<ArgsContext> => ({
    type: "handler",
    name: "handler-download-file",
    async handle(context) {
        const event = context.invocationArgs;

        const handler = createHandler(async event => {
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
        });

        return await handler(event);
    }
});
