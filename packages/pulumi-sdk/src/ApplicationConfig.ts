import { ApplicationHook } from "./ApplicationHook";

export interface ApplicationConfig extends Partial<ApplicationHooks> {
    id: string;
    name: string;
    description?: string;
    cli?: Record<string, any>;
}

export interface ApplicationHooks {
    // TODO add typing to deploy hooks
    beforeBuild: ApplicationHook;
    afterBuild: ApplicationHook;
    beforeDeploy: ApplicationHook;
    afterDeploy: ApplicationHook;
}
