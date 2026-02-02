import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { EnvVar as EnvVarExt } from "~/extensions/EnvVar.js";

export const applyEnvVars = (projectExtensions: IProjectConfigModel) => {
    const envVarExtensions = projectExtensions.extensionsByType(EnvVarExt);
    for (const envVarExtension of envVarExtensions) {
        if (!process.env[envVarExtension.params.varName]) {
            process.env[envVarExtension.params.varName] = envVarExtension.params.value;
        }
    }
};
