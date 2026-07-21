import {
    definitions as projectDefinitions,
    type ExtensionDefinitionModel
} from "@webiny/project/extensions/index.js";
import { definitions as cliDefinitions } from "@webiny/cli-core/extensions/index.js";
import { Sqlite } from "./Sqlite.js";
import { Postgres } from "./Postgres.js";

/**
 * Built-in extension definitions the server hosting type registers with the SDK (via
 * `<ExtensionDefinitions>` in the server `webiny.config.base.tsx`). Without this, `hydrateConfig`
 * can't resolve built-in extension types (e.g. `Project/EnvVar`, `Admin/ApiUrl`) and silently drops
 * them — which is how the admin API URL (baked as `WEBINY_ADMIN_API_URL`) went missing.
 *
 * Mirrors project-aws's `ProjectAws/definitions.ts`, minus the AWS/Pulumi-only definitions (there is
 * no Pulumi or deploy in the self-hosted hosting type).
 */
const definitions = [
    ...cliDefinitions,
    ...projectDefinitions,
    Sqlite.def,
    Postgres.def
] as unknown as ExtensionDefinitionModel<any>[];

export default definitions;
