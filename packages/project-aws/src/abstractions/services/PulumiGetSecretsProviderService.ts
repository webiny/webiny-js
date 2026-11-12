import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface IPulumiGetSecretsProviderService {
    execute(): string;
}

export const PulumiGetSecretsProviderService = createAbstraction<IPulumiGetSecretsProviderService>(
    "PulumiGetSecretsProviderService"
);

export namespace PulumiGetSecretsProviderService {
    export type Interface = IPulumiGetSecretsProviderService;
}
