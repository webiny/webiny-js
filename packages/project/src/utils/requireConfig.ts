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
    //eslint-disable-next-line import/dynamic-import-chunkname
    return await import(input).then(m => m.default ?? m);
};

export const requireConfigWithExecute = async <
    T extends IRequireConfigResult = IRequireConfigResult
>(
    configPath: string,
    params: IRequireConfigParams
): Promise<T> => {
    //eslint-disable-next-line import/dynamic-import-chunkname
    const required = await import(configPath).then(m => m.default ?? m);

    if (typeof required === "function") {
        return required(params);
    }

    return required;
};
