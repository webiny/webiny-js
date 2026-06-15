import { createBuildAdmin, createWatchAdmin } from "@webiny/build-tools";

export interface IAdminAppConfigOptions {
    env: string;
    variant?: string;
    [key: string]: any;
}

export const createAdminAppConfig = () => {
    return ({ options }: { options: IAdminAppConfigOptions }) => ({
        commands: {
            build: createBuildAdmin({ cwd: process.cwd() })(options),
            watch: createWatchAdmin({ cwd: process.cwd() })(options)
        }
    });
};
