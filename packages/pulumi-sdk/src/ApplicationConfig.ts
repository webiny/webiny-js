// TODO add typing to deploy hooks
export interface ApplicationHook {
    (params: any, context: any): Promise<void> | void;
}

export interface ApplicationConfig {
    id: string;
    name: string;
    description?: string;
    cli?: Record<string, any>;

    // TODO add typing to deploy hooks
    beforeBuild?: ApplicationHook;
    afterBuild?: ApplicationHook;
    beforeDeploy?: ApplicationHook;
    afterDeploy?: ApplicationHook;
}
