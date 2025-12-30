import { createGetEnv } from "~/pulumi/env/base.js";

export const getEnvVariableWebinyProjectName = createGetEnv({
    name: "WBY_PROJECT_NAME"
});
