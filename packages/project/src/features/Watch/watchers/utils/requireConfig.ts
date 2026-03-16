import { pathToFileURL } from "node:url";
import path from "node:path";

const toImportSpecifier = (inputPath: string): string => {
    return path.isAbsolute(inputPath) ? pathToFileURL(inputPath).href : inputPath;
};

export interface IRequireConfigOptions {
    env: string;
    variant: string | undefined;
    region: string | undefined;
    debug?: boolean;
    cwd: string;
}

export interface IRequireConfigResult {
    commands: {
        build: (options: IRequireConfigOptions) => Promise<void>;

        // TODO: revisit context.
        watch: (options: IRequireConfigOptions, context: any) => Promise<void>;
    };
}

export interface IRequireConfigParams {
    [key: string]: Record<string, any>;
}

export const requireConfig = async <T extends IRequireConfigResult = IRequireConfigResult>(
    input: string
): Promise<T> => {
    return await import(toImportSpecifier(input)).then(m => m.default ?? m);
};

export const requireConfigWithExecute = async <
    T extends IRequireConfigResult = IRequireConfigResult
>(
    configPath: string,
    params: IRequireConfigParams
): Promise<T> => {
    const module = await import(toImportSpecifier(configPath));

    // TODO: https://github.com/orgs/webiny/projects/32/views/2?pane=issue&itemId=125453089
    const config = module.default.default ?? module.default ?? module;

    if (typeof config === "function") {
        return config(params);
    }

    return config;
};
