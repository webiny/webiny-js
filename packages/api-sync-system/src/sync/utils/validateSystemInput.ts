import type { ISystem } from "~/sync/types.js";
import { createSystemName } from "~/utils/createSystemName.js";

export interface IValidResponse {
    system: ISystem;
    error?: never;
}

export interface IErrorResponse {
    error: string;
    system?: never;
}

export type ValidateSystemInputResponse = IValidResponse | IErrorResponse;

export const validateSystemInput = (input: Partial<ISystem>): ValidateSystemInputResponse => {
    const { env, region, variant, version } = input;
    if (!env) {
        return {
            error: "Sync System: No environment variable provided. Sync System will not be attached."
        };
    } else if (!region) {
        return {
            error: "Sync System: No region variable provided. Sync System will not be attached."
        };
    } else if (!version) {
        return {
            error: "Sync System: No version variable provided. Sync System will not be attached."
        };
    }
    const name = createSystemName({
        env,
        variant
    });

    return {
        system: {
            env,
            name,
            region,
            variant,
            version
        }
    };
};
