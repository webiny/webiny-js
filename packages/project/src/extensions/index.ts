import { ExtensionDefinitions } from "./ExtensionDefinitions.js";
import { ProjectDecorator } from "./ProjectDecorator.js";
import { ProjectImplementation } from "./ProjectImplementation.js";
import { ProjectId } from "./ProjectId.js";
import { Telemetry } from "./Telemetry.js";
import { EnvVar } from "./EnvVar.js";
import { DatabaseSetup } from "./DatabaseSetup.js";
import { Wcp, wcpDefinitions } from "./Wcp.js";
import { BuildParam } from "./ApiBuildParam.js";
import { AdminBuildParam } from "./AdminBuildParam.js";
import { AdminExtension } from "./AdminExtension.js";
import { GenericExtension } from "./GenericExtension.js";

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
    PulumiResourceNamePrefix,
    CoreStackOutputValue,
    ApiStackOutputValue,
    AdminStackOutputValue
} from "./pulumi/index.js";

// Exports.
export { Telemetry };
export { ProjectId };
export { ProjectDecorator };
export { ProjectImplementation };
export { ExtensionDefinitions };
export { EnvVar };
export { DatabaseSetup };
export { Wcp };
export { BuildParam };
export { AdminBuildParam };
export { AdminExtension };
export { GenericExtension };

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
export { CoreStackOutputValue };
export { ApiStackOutputValue };
export { AdminStackOutputValue };

// Definitions (used internally). 👇
export const definitions = [
    Telemetry.def,
    ProjectId.def,
    ProjectDecorator.def,
    ProjectImplementation.def,
    ExtensionDefinitions.def,
    EnvVar.def,

    // Hooks.
    AdminAfterBuild.def,
    AdminAfterDeploy.def,
    BeforeBuild.def,
    BeforeDeploy.def,
    BeforeWatch.def,
    AfterBuild.def,
    AfterDeploy.def,
    AdminBeforeBuild.def,
    AdminBeforeDeploy.def,
    AdminBeforeWatch.def,
    ApiAfterBuild.def,
    ApiAfterDeploy.def,
    ApiBeforeBuild.def,
    ApiBeforeDeploy.def,
    ApiBeforeWatch.def,
    CoreAfterBuild.def,
    CoreAfterDeploy.def,
    CoreBeforeBuild.def,
    CoreBeforeDeploy.def,
    CoreBeforeWatch.def,

    // Pulumi.
    CorePulumi.def,
    PulumiResourceNamePrefix.def,
    ProductionEnvironments.def,
    CoreStackOutputValue.def,
    ApiStackOutputValue.def,
    AdminStackOutputValue.def,
    DatabaseSetup.def,
    BuildParam.def,
    AdminBuildParam.def,
    AdminExtension.def,
    GenericExtension.def,
    ...wcpDefinitions
];

export { Project } from "./Project.js";

export * from "../defineExtension/index.js";
