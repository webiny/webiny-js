import { createBuildAdmin, createWatchAdmin } from "@webiny/build-tools";

export interface IAdminAppConfigOptions {
    env: string;
    variant?: string;
    cwd?: string;
    [key: string]: any;
}

export const createAdminAppConfig = () => {
    return ({ options }: { options: IAdminAppConfigOptions }) => ({
        commands: {
            build: createBuildAdmin({ cwd: options.cwd || process.cwd() }),
            watch: createWatchAdmin({ cwd: options.cwd || process.cwd() })
        }
    });
};
