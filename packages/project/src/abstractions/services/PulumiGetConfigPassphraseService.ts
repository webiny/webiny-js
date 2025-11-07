import { Abstraction } from "@webiny/di";

export interface IPulumiGetConfigPassphraseService {
    execute(): string;
}

export const PulumiGetConfigPassphraseService = new Abstraction<IPulumiGetConfigPassphraseService>(
    "PulumiGetConfigPassphraseService"
);

export namespace PulumiGetConfigPassphraseService {
    export type Interface = IPulumiGetConfigPassphraseService;
}
