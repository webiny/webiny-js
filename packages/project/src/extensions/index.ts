import { ExtensionDefinitions } from "./ExtensionDefinitions.js";
import { ProjectDecorator } from "./ProjectDecorator.js";
import { ProjectImplementation } from "./ProjectImplementation.js";
import { ProjectId } from "./ProjectId.js";
import { Telemetry } from "./Telemetry.js";
import { EnvVar } from "./EnvVar.js";
import { DatabaseSetup } from "./DatabaseSetup.js";
import { FeatureFlags } from "./FeatureFlags.js";
import { BugReporter } from "./BugReporter.js";
import { BuildParam } from "./ApiBuildParam.js";
import { AdminBuildParam } from "./AdminBuildParam.js";
import { AdminApiUrl } from "./AdminApiUrl.js";
import { AdminWebsocketsUrl } from "./AdminWebsocketsUrl.js";
import { AdminExtension } from "./AdminExtension.js";
import { ApiExtension } from "./ApiExtension.js";
import { BackgroundTasks } from "./api/index.js";
import { ModelFieldCompression } from "./api/index.js";
import { Smtp } from "./api/index.js";

// Hooks.
import {
    AdminAfterBuild,
    AdminBeforeBuild,
    AdminBeforeWatch,
    AfterBuild,
    BeforeWatch,
    ApiAfterBuild,
    ApiBeforeBuild,
    ApiBeforeWatch,
    BeforeBuild,
    CoreAfterBuild,
    CoreBeforeBuild,
    CoreBeforeWatch
} from "./hooks/index.js";

import { ProductionEnvironments } from "./ProductionEnvironments.js";

// Exports.
export { Telemetry };
export { ProjectId };
export { ProjectDecorator };
export { ProjectImplementation };
export { ExtensionDefinitions };
export { EnvVar };
export { FeatureFlags };
export { BugReporter };
export { DatabaseSetup };
export { BuildParam };
export { AdminBuildParam };
export { AdminApiUrl };
export { AdminWebsocketsUrl };
export { AdminExtension };
export { ApiExtension };

// Hooks.
export { BeforeBuild };
export { BeforeWatch };
export { AfterBuild };
export { AdminBeforeBuild };
export { AdminBeforeWatch };
export { AdminAfterBuild };
export { ApiBeforeBuild };
export { ApiBeforeWatch };
export { ApiAfterBuild };
export { CoreBeforeBuild };
export { CoreBeforeWatch };
export { CoreAfterBuild };

export { ProductionEnvironments };

// Definitions (used internally). 👇
export const definitions = [
    Telemetry.def,
    ProjectId.def,
    ProjectDecorator.def,
    ProjectImplementation.def,
    ExtensionDefinitions.def,
    EnvVar.def,
    FeatureFlags.def,
    BugReporter.def,

    // Hooks.
    AdminAfterBuild.def,
    BeforeBuild.def,
    BeforeWatch.def,
    AfterBuild.def,
    AdminBeforeBuild.def,
    AdminBeforeWatch.def,
    ApiAfterBuild.def,
    ApiBeforeBuild.def,
    ApiBeforeWatch.def,
    CoreAfterBuild.def,
    CoreBeforeBuild.def,
    CoreBeforeWatch.def,

    ProductionEnvironments.def,
    DatabaseSetup.def,
    BuildParam.def,
    AdminBuildParam.def,
    AdminApiUrl.def,
    AdminWebsocketsUrl.def,
    AdminExtension.def,
    ApiExtension.def,

    // Api settings that apply to every hosting type.
    BackgroundTasks.def,
    ModelFieldCompression.def,
    Smtp.def
];

export { Project } from "./Project.js";

export * from "../defineExtension/index.js";
