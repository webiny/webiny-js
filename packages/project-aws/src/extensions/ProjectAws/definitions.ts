import {
    definitions as projectDefinitions,
    type ExtensionDefinitionModel
} from "@webiny/project/extensions/index.js";
import { definitions as cliDefinitions } from "@webiny/cli-core/extensions/index.js";
import { definitions as projectAws } from "~/pulumi/extensions/index.js";
import { AutoInstall } from "./AutoInstall.js";

const definitions = [
    ...cliDefinitions,
    ...projectDefinitions,
    ...projectAws,
    AutoInstall.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
