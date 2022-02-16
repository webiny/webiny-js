import { ApplicationHook } from "./ApplicationHook";

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
