import type { S3Client } from "@webiny/aws-sdk/client-s3";
import type { IActionHandler } from "~/worker/types.js";
import { WorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import { WebinyError } from "@webiny/error";

export interface IActionHandlerParamsGetS3ClientCb {
    (region: string): S3Client;
}

export interface IActionHandlerParams {
    plugins: WorkerActionPlugin[];
}

export class WorkerActionHandler implements IActionHandler {
    private readonly plugins: WorkerActionPlugin[];

    public constructor(params: IActionHandlerParams) {
        this.plugins = params.plugins;
    }

    public async handle(payload: unknown): Promise<void> {
        for (const plugin of this.plugins) {
            const data = plugin.parse(payload);
            if (!data) {
                continue;
            }
            return await plugin.handle({
                data
            });
        }
        throw new WebinyError({
            message: "Unsupported action on payload.",
            code: "UNSUPPORTED_ACTION",
            data: {
                payload
            }
        });
    }
}
