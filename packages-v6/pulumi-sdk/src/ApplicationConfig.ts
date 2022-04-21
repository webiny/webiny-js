import { ApplicationHook } from "./ApplicationHook";
import { PulumiApp } from "./PulumiApp";

export interface ApplicationContext {
    env: string;
}

export interface ApplicationHooks {
    // TODO add typing to deploy hooks
    onBeforeBuild: ApplicationHook;
    onAfterBuild: ApplicationHook;
    onBeforeDeploy: ApplicationHook;
    onAfterDeploy: ApplicationHook;
}

export interface ApplicationConfig<TApp extends PulumiApp> extends Partial<ApplicationHooks> {
    config?(app: TApp, ctx: ApplicationContext): void;
}
