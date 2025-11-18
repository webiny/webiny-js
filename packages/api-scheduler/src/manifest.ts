import { ServiceDiscovery } from "@webiny/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createZodError } from "@webiny/utils";
import zod from "zod";

const schema = zod.object({
    scheduler: zod.object({
        lambdaArn: zod.string(),
        roleArn: zod.string()
    })
});

export interface IGetManifestErrorResult {
    error: Error;
    data?: never;
}

export interface IGetManifestSuccessResult {
    data: {
        lambdaArn: string;
        roleArn: string;
    };
    error?: never;
}

export type IGetManifestResult = IGetManifestSuccessResult | IGetManifestErrorResult;

export interface IGetManifestParams {
    client: DynamoDBDocument;
}

export const getManifest = async (params: IGetManifestParams): Promise<IGetManifestResult> => {
    try {
        ServiceDiscovery.setDocumentClient(params.client);
        const manifest = await ServiceDiscovery.load();
        if (!manifest) {
            return {
                error: new Error("Manifest could not be loaded.")
            };
        } else if (!manifest.scheduler) {
            return {
                error: new Error("Scheduler not found in the Manifest.")
            };
        }

        const result = await schema.safeParseAsync(manifest);
        if (!result.success) {
            return {
                error: createZodError(result.error)
            };
        }

        return {
            data: result.data.scheduler
        };
    } catch (ex) {
        return {
            error: ex
        };
    }
};
