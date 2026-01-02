import { createAbstraction } from "@webiny/feature/api";

export interface IEncryption {
    encrypt(value: string): Promise<string>;
    decrypt(value: string): Promise<string>;
}

export const Encryption = createAbstraction<IEncryption>("Encryption");

export namespace Encryption {
    export type Interface = IEncryption;
}
