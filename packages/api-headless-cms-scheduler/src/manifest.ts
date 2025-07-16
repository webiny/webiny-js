import { ServiceDiscovery } from "@webiny/api";
import { createZodError } from "@webiny/utils";
import zod from "zod";

const schema = zod.object({
    schedule: zod.object({
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

export const getManifest = async (): Promise<IGetManifestResult> => {
    try {
        const manifest = await ServiceDiscovery.load();
        if (!manifest) {
            return {
                error: new Error("Manifest could not be loaded.")
            };
        } else if (!manifest.schedule) {
            return {
                error: new Error("Schedule not found in the Manifest.")
            };
        }

        const result = await schema.safeParseAsync(manifest);
        if (!result.success) {
            return {
                error: createZodError(result.error)
            };
        }

        return {
            data: result.data.schedule
        };
    } catch (ex) {
        return {
            error: ex
        };
    }
};
