import { createAbstraction } from "@webiny/feature/api";

export interface IEncryption {
    encrypt(value: string): string;
    decrypt(value: string): string;
}

/** Symmetric encryption and decryption using a configured secret key. */
export const Encryption = createAbstraction<IEncryption>("Encryption");

export namespace Encryption {
    export type Interface = IEncryption;
}
