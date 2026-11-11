import {
    definitions as projectDefinitions,
    type ExtensionDefinitionModel
} from "@webiny/project/extensions/index.js";
import { definitions as cliDefinitions } from "@webiny/cli-core/extensions/index.js";
import { definitions as projectAws } from "~/pulumi/extensions/index.js";
import { AutoInstall } from "@webiny/project-extensions-aws/extensions/AutoInstall.js";
import { deployHooks } from "@webiny/project-extensions-aws/extensions/hooks/deployHooks.js";
import { PulumiResourceNamePrefix } from "@webiny/project-extensions-aws/extensions/PulumiResourceNamePrefix.js";

const definitions = [
    ...cliDefinitions,
    ...projectDefinitions,
    ...projectAws,
    AutoInstall.def,
    PulumiResourceNamePrefix.def,
    ...deployHooks.map(hook => hook.def)
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
