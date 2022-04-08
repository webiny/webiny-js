import { ApplicationHook } from "./ApplicationHook";
import { PulumiApp } from "./PulumiApp";

export interface ApplicationContext {
    env: string;
    appDir: string;
    projectDir: string;
}

export interface ApplicationHooks {
    // TODO add typing to deploy hooks
    beforeBuild: ApplicationHook;
    afterBuild: ApplicationHook;
    beforeDeploy: ApplicationHook;
    afterDeploy: ApplicationHook;
}

export interface ApplicationConfig<TApp extends PulumiApp> extends Partial<ApplicationHooks> {
    config?(app: TApp, ctx: ApplicationContext): void;
}
