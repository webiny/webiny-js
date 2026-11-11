import {
    definitions as projectDefinitions,
    type ExtensionDefinitionModel
} from "@webiny/project/extensions/index.js";
import { definitions as cliDefinitions } from "@webiny/cli-core/extensions/index.js";
import { definitions as projectAws } from "~/pulumi/extensions/index.js";
import { AutoInstall } from "@webiny/project-extensions-aws/extensions/AutoInstall.js";
import { AdminAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AdminAfterDeploy.js";
import { AdminBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AdminBeforeDeploy.js";
import { AfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AfterDeploy.js";
import { ApiAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/ApiAfterDeploy.js";
import { ApiBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/ApiBeforeDeploy.js";
import { BeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/BeforeDeploy.js";
import { CoreAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/CoreAfterDeploy.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/CoreBeforeDeploy.js";
import { PulumiResourceNamePrefix } from "@webiny/project-extensions-aws/extensions/PulumiResourceNamePrefix.js";

const definitions = [
    ...cliDefinitions,
    ...projectDefinitions,
    ...projectAws,
    AutoInstall.def,
    PulumiResourceNamePrefix.def,
    AdminAfterDeploy.def,
    AdminBeforeDeploy.def,
    AfterDeploy.def,
    ApiAfterDeploy.def,
    ApiBeforeDeploy.def,
    BeforeDeploy.def,
    CoreAfterDeploy.def,
    CoreBeforeDeploy.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
