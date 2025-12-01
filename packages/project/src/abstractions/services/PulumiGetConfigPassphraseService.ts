import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IPulumiGetConfigPassphraseService {
    execute(): string;
}

export const PulumiGetConfigPassphraseService =
    createAbstraction<IPulumiGetConfigPassphraseService>("PulumiGetConfigPassphraseService");

export namespace PulumiGetConfigPassphraseService {
    export type Interface = IPulumiGetConfigPassphraseService;
}
