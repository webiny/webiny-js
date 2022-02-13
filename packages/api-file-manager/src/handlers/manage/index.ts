import path from "path";
import S3 from "aws-sdk/clients/s3";
import { HandlerPlugin } from "@webiny/handler/types";
import { createHandler, getEnvironment, EventHandlerCallable } from "../utils";
import managers from "../transform/managers";
import { ArgsContext } from "@webiny/handler-args/types";
import { ManageHandlerEventArgs } from "~/handlers/types";

export default (): HandlerPlugin<ArgsContext<ManageHandlerEventArgs>> => ({
    type: "handler",
    name: "handler-download-file",
    async handle(context) {
        // TODO @ts-refactor check in createHandler for returns types that eventHandler must return
        // @ts-ignore
        const eventHandler: EventHandlerCallable<ManageHandlerEventArgs> = async event => {
            const keys: string[] = [];
            for (let i = 0; i < event.Records.length; i++) {
                const record = event.Records[i];
                if (typeof record.s3.object.key === "string") {
                    keys.push(record.s3.object.key);
                }
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
        };

        const handler = createHandler(eventHandler);

        return await handler(context.invocationArgs);
    }
});
