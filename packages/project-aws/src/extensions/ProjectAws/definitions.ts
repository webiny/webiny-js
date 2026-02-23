import {
    definitions as projectDefinitions,
    type ExtensionDefinitionModel
} from "@webiny/project/extensions/index.js";
import { definitions as cliDefinitions } from "@webiny/cli-core/extensions/index.js";
import { definitions as apiCoreDefinitions } from "@webiny/api-core/extensions/index.js";
import { definitions as cmsDefinitions } from "@webiny/api-headless-cms/extensions/index.js";
import { definitions as projectAws } from "~/pulumi/extensions/index.js";
import { AutoInstall } from "./AutoInstall.js";

const definitions = [
    ...cliDefinitions,
    ...apiCoreDefinitions,
    ...projectDefinitions,
    ...cmsDefinitions,
    ...projectAws,
    AutoInstall.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
