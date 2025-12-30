import { createGetEnvOptional } from "~/pulumi/env/base.js";

export const getEnvVariableWebinyVariant = createGetEnvOptional<string>({
    name: "WBY_ENV_VARIANT",
    defaultValue: ""
});
