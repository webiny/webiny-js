import { extensionDefinitions } from "./extensionDefinitions.js";
import { projectDecorator } from "./projectDecorator.js";
import { projectImplementation } from "./projectImplementation.js";
import { projectId } from "./projectId.js";
import { telemetry } from "./telemetry.js";
import { envVar } from "./envVar.js";

// Hooks.
import {
    adminAfterBuild,
    adminAfterDeploy,
    adminBeforeBuild,
    adminBeforeDeploy,
    adminBeforeWatch,
    afterBuild,
    afterDeploy,
    beforeDeploy,
    beforeWatch,
    apiAfterBuild,
    apiAfterDeploy,
    apiBeforeBuild,
    apiBeforeDeploy,
    apiBeforeWatch,
    beforeBuild,
    coreAfterBuild,
    coreAfterDeploy,
    coreBeforeBuild,
    coreBeforeDeploy,
    coreBeforeWatch
} from "./hooks/index.js";

// Pulumi.
import {
    adminPulumi,
    apiPulumi,
    corePulumi,
    productionEnvironments,
    pulumiResourceNamePrefix
} from "./pulumi/index.js";

// Exports.
export const Telemetry = telemetry.ReactComponent;
export const ProjectId = projectId.ReactComponent;
export const ProjectDecorator = projectDecorator.ReactComponent;
export const ProjectImplementation = projectImplementation.ReactComponent;
export const ExtensionDefinitions = extensionDefinitions.ReactComponent;
export const EnvVar = envVar.ReactComponent;

// Hooks.
export const BeforeBuild = beforeBuild.ReactComponent;
export const BeforeDeploy = beforeDeploy.ReactComponent;
export const BeforeWatch = beforeWatch.ReactComponent;
export const AfterBuild = afterBuild.ReactComponent;
export const AfterDeploy = afterDeploy.ReactComponent;
export const AdminBeforeBuild = adminBeforeBuild.ReactComponent;
export const AdminBeforeDeploy = adminBeforeDeploy.ReactComponent;
export const AdminBeforeWatch = adminBeforeWatch.ReactComponent;
export const AdminAfterBuild = adminAfterBuild.ReactComponent;
export const AdminAfterDeploy = adminAfterDeploy.ReactComponent;
export const ApiBeforeBuild = apiBeforeBuild.ReactComponent;
export const ApiBeforeDeploy = apiBeforeDeploy.ReactComponent;
export const ApiBeforeWatch = apiBeforeWatch.ReactComponent;
export const ApiAfterBuild = apiAfterBuild.ReactComponent;
export const ApiAfterDeploy = apiAfterDeploy.ReactComponent;
export const CoreBeforeBuild = coreBeforeBuild.ReactComponent;
export const CoreBeforeDeploy = coreBeforeDeploy.ReactComponent;
export const CoreBeforeWatch = coreBeforeWatch.ReactComponent;
export const CoreAfterBuild = coreAfterBuild.ReactComponent;
export const CoreAfterDeploy = coreAfterDeploy.ReactComponent;

// Pulumi.
export const CorePulumi = corePulumi.ReactComponent;
export const AdminPulumi = adminPulumi.ReactComponent;
export const ApiPulumi = apiPulumi.ReactComponent;
export const PulumiResourceNamePrefix = pulumiResourceNamePrefix.ReactComponent;
export const ProductionEnvironments = productionEnvironments.ReactComponent;

// Definitions (used internally). 👇
export const definitions = [
    telemetry.definition,
    projectId.definition,
    projectDecorator.definition,
    projectImplementation.definition,
    extensionDefinitions.definition,
    envVar.definition,

    // Hooks.
    adminAfterBuild.definition,
    adminAfterDeploy.definition,
    beforeBuild.definition,
    beforeDeploy.definition,
    beforeWatch.definition,
    afterBuild.definition,
    afterDeploy.definition,
    adminBeforeBuild.definition,
    adminBeforeDeploy.definition,
    adminBeforeWatch.definition,
    apiAfterBuild.definition,
    apiAfterDeploy.definition,
    apiBeforeBuild.definition,
    apiBeforeDeploy.definition,
    apiBeforeWatch.definition,
    coreAfterBuild.definition,
    coreAfterDeploy.definition,
    coreBeforeBuild.definition,
    coreBeforeDeploy.definition,
    coreBeforeWatch.definition,

    // Pulumi.
    corePulumi.definition,
    pulumiResourceNamePrefix.definition,
    productionEnvironments.definition
];

export { Project } from "./Project.js";

export * from "../defineExtension/index.js";
