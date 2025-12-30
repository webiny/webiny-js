import { createConfiguration } from "./configuration.js";

export interface IWithEnvParams {
    env: string;
}

export const withEnv = (params: IWithEnvParams) => {
    return createConfiguration(() => {
        return {
            WBY_ENV: params.env
        };
    });
};
