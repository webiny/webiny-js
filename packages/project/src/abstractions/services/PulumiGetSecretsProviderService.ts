import { Abstraction } from "@webiny/di";

export interface IPulumiGetSecretsProviderService {
    execute(): string;
}

export const PulumiGetSecretsProviderService = new Abstraction<IPulumiGetSecretsProviderService>(
    "PulumiGetSecretsProviderService"
);

export namespace PulumiGetSecretsProviderService {
    export type Interface = IPulumiGetSecretsProviderService;
}
