import { ExtensionDefinitions } from "./ExtensionDefinitions.js";
import { ProjectDecorator } from "./ProjectDecorator.js";
import { ProjectImplementation } from "./ProjectImplementation.js";
import { ProjectId } from "./ProjectId.js";
import { Telemetry } from "./Telemetry.js";
import { EnvVar } from "./EnvVar.js";

// Hooks.
import {
    AdminAfterBuild,
    AdminAfterDeploy,
    AdminBeforeBuild,
    AdminBeforeDeploy,
    AdminBeforeWatch,
    AfterBuild,
    AfterDeploy,
    BeforeDeploy,
    BeforeWatch,
    ApiAfterBuild,
    ApiAfterDeploy,
    ApiBeforeBuild,
    ApiBeforeDeploy,
    ApiBeforeWatch,
    BeforeBuild,
    CoreAfterBuild,
    CoreAfterDeploy,
    CoreBeforeBuild,
    CoreBeforeDeploy,
    CoreBeforeWatch
} from "./hooks/index.js";

// Pulumi.
import {
    AdminPulumi,
    ApiPulumi,
    CorePulumi,
    ProductionEnvironments,
    PulumiResourceNamePrefix
} from "./pulumi/index.js";

// Exports.
export { Telemetry };
export { ProjectId };
export { ProjectDecorator };
export { ProjectImplementation };
export { ExtensionDefinitions };
export { EnvVar };

// Hooks.
export { BeforeBuild };
export { BeforeDeploy };
export { BeforeWatch };
export { AfterBuild };
export { AfterDeploy };
export { AdminBeforeBuild };
export { AdminBeforeDeploy };
export { AdminBeforeWatch };
export { AdminAfterBuild };
export { AdminAfterDeploy };
export { ApiBeforeBuild };
export { ApiBeforeDeploy };
export { ApiBeforeWatch };
export { ApiAfterBuild };
export { ApiAfterDeploy };
export { CoreBeforeBuild };
export { CoreBeforeDeploy };
export { CoreBeforeWatch };
export { CoreAfterBuild };
export { CoreAfterDeploy };

// Pulumi.
export { CorePulumi };
export { AdminPulumi };
export { ApiPulumi };
export { PulumiResourceNamePrefix };
export { ProductionEnvironments };

// Definitions (used internally). 👇
export const definitions = [
    Telemetry.definition,
    ProjectId.definition,
    ProjectDecorator.definition,
    ProjectImplementation.definition,
    ExtensionDefinitions.definition,
    EnvVar.definition,

    // Hooks.
    AdminAfterBuild.definition,
    AdminAfterDeploy.definition,
    BeforeBuild.definition,
    BeforeDeploy.definition,
    BeforeWatch.definition,
    AfterBuild.definition,
    AfterDeploy.definition,
    AdminBeforeBuild.definition,
    AdminBeforeDeploy.definition,
    AdminBeforeWatch.definition,
    ApiAfterBuild.definition,
    ApiAfterDeploy.definition,
    ApiBeforeBuild.definition,
    ApiBeforeDeploy.definition,
    ApiBeforeWatch.definition,
    CoreAfterBuild.definition,
    CoreAfterDeploy.definition,
    CoreBeforeBuild.definition,
    CoreBeforeDeploy.definition,
    CoreBeforeWatch.definition,

    // Pulumi.
    CorePulumi.definition,
    PulumiResourceNamePrefix.definition,
    ProductionEnvironments.definition
];

export { Project } from "./Project.js";

export * from "../defineExtension/index.js";
