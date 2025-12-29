import { ExtensionDefinitions as ExtensionDefinitionsDef } from "./ExtensionDefinitions.js";
import { ProjectDecorator as ProjectDecoratorDef } from "./ProjectDecorator.js";
import { ProjectId as ProjectIdDef } from "./ProjectId.js";
import { Telemetry as TelemetryDef } from "./Telemetry.js";
import { EnvVar as EnvVarDef } from "./EnvVar.js";

// Hooks.
import {
    AdminAfterBuild as AdminAfterBuildDef,
    AdminAfterDeploy as AdminAfterDeployDef,
    AdminBeforeBuild as AdminBeforeBuildDef,
    AdminBeforeDeploy as AdminBeforeDeployDef,
    AdminBeforeWatch as AdminBeforeWatchDef,
    AfterBuild as AfterBuildDef,
    AfterDeploy as AfterDeployDef,
    BeforeDeploy as BeforeDeployDef,
    BeforeWatch as BeforeWatchDef,
    ApiAfterBuild as ApiAfterBuildDef,
    ApiAfterDeploy as ApiAfterDeployDef,
    ApiBeforeBuild as ApiBeforeBuildDef,
    ApiBeforeDeploy as ApiBeforeDeployDef,
    ApiBeforeWatch as ApiBeforeWatchDef,
    BeforeBuild as BeforeBuildDef,
    CoreAfterBuild as CoreAfterBuildDef,
    CoreAfterDeploy as CoreAfterDeployDef,
    CoreBeforeBuild as CoreBeforeBuildDef,
    CoreBeforeDeploy as CoreBeforeDeployDef,
    CoreBeforeWatch as CoreBeforeWatchDef
} from "./hooks/index.js";

// Pulumi.
import {
    AdminPulumi as AdminPulumiDef,
    ApiPulumi as ApiPulumiDef,
    CorePulumi as CorePulumiDef,
    ProductionEnvironments as ProductionEnvironmentsDef,
    PulumiResourceNamePrefix as PulumiResourceNamePrefixDef
} from "./pulumi/index.js";

// Exports (React Components).
export const Telemetry = TelemetryDef.ReactComponent;
export const ProjectId = ProjectIdDef.ReactComponent;
export const ProjectDecorator = ProjectDecoratorDef.ReactComponent;
export const ExtensionDefinitions = ExtensionDefinitionsDef.ReactComponent;
export const EnvVar = EnvVarDef.ReactComponent;

// Hooks.
export const BeforeBuild = BeforeBuildDef.ReactComponent;
export const BeforeDeploy = BeforeDeployDef.ReactComponent;
export const BeforeWatch = BeforeWatchDef.ReactComponent;
export const AfterBuild = AfterBuildDef.ReactComponent;
export const AfterDeploy = AfterDeployDef.ReactComponent;
export const AdminBeforeBuild = AdminBeforeBuildDef.ReactComponent;
export const AdminBeforeDeploy = AdminBeforeDeployDef.ReactComponent;
export const AdminBeforeWatch = AdminBeforeWatchDef.ReactComponent;
export const AdminAfterBuild = AdminAfterBuildDef.ReactComponent;
export const AdminAfterDeploy = AdminAfterDeployDef.ReactComponent;
export const ApiBeforeBuild = ApiBeforeBuildDef.ReactComponent;
export const ApiBeforeDeploy = ApiBeforeDeployDef.ReactComponent;
export const ApiBeforeWatch = ApiBeforeWatchDef.ReactComponent;
export const ApiAfterBuild = ApiAfterBuildDef.ReactComponent;
export const ApiAfterDeploy = ApiAfterDeployDef.ReactComponent;
export const CoreBeforeBuild = CoreBeforeBuildDef.ReactComponent;
export const CoreBeforeDeploy = CoreBeforeDeployDef.ReactComponent;
export const CoreBeforeWatch = CoreBeforeWatchDef.ReactComponent;
export const CoreAfterBuild = CoreAfterBuildDef.ReactComponent;
export const CoreAfterDeploy = CoreAfterDeployDef.ReactComponent;

// Pulumi.
export const CorePulumi = CorePulumiDef.ReactComponent;
export const AdminPulumi = AdminPulumiDef.ReactComponent;
export const ApiPulumi = ApiPulumiDef.ReactComponent;
export const PulumiResourceNamePrefix = PulumiResourceNamePrefixDef.ReactComponent;
export const ProductionEnvironments = ProductionEnvironmentsDef.ReactComponent;

// Definitions (used internally). 👇
export const definitions = [
    TelemetryDef.definition,
    ProjectIdDef.definition,
    ProjectDecoratorDef.definition,
    ExtensionDefinitionsDef.definition,
    EnvVarDef.definition,

    // Hooks.
    AdminAfterBuildDef.definition,
    AdminAfterDeployDef.definition,
    BeforeBuildDef.definition,
    BeforeDeployDef.definition,
    BeforeWatchDef.definition,
    AfterBuildDef.definition,
    AfterDeployDef.definition,
    AdminBeforeBuildDef.definition,
    AdminBeforeDeployDef.definition,
    AdminBeforeWatchDef.definition,
    ApiAfterBuildDef.definition,
    ApiAfterDeployDef.definition,
    ApiBeforeBuildDef.definition,
    ApiBeforeDeployDef.definition,
    ApiBeforeWatchDef.definition,
    CoreAfterBuildDef.definition,
    CoreAfterDeployDef.definition,
    CoreBeforeBuildDef.definition,
    CoreBeforeDeployDef.definition,
    CoreBeforeWatchDef.definition,

    // Pulumi.
    CorePulumiDef.definition,
    PulumiResourceNamePrefixDef.definition,
    ProductionEnvironmentsDef.definition
];

export { Project } from "./Project.js";

export * from "../defineExtension/index.js";
