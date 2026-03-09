export { LoggerService as Logger } from "@webiny/project/abstractions/services/LoggerService.js";
export { UiService as Ui } from "@webiny/project/abstractions/services/UiService.js";
export { AfterBuild as AfterBuildHook } from "@webiny/project/abstractions/features/hooks/AfterBuild.js";
export { BeforeBuild as BeforeBuildHook } from "@webiny/project/abstractions/features/hooks/BeforeBuild.js";
export { AfterDeploy as AfterDeployHook } from "@webiny/project/abstractions/features/hooks/AfterDeploy.js";
export { BeforeDeploy as BeforeDeployHook } from "@webiny/project/abstractions/features/hooks/BeforeDeploy.js";
export { BeforeWatch as BeforeWatchHook } from "@webiny/project/abstractions/features/hooks/BeforeWatch.js";
export { EnvVar } from "@webiny/project/extensions/EnvVar.js";
export {
    ApiStackOutputService as ApiStackOutput,
    CoreStackOutputService as CoreStackOutput,
    ApiGqlClient,
    AdminStackOutputService as AdminStackOutput,
    InvokeLambdaFunction
} from "@webiny/project-aws/abstractions/index.js";
