import { createAbstraction } from "@webiny/feature/api";

export interface IEncryption {
    encrypt(value: string): Promise<string>;
    decrypt(value: string): Promise<string>;
}

/** Symmetric encryption and decryption using a configured secret key. */
export const Encryption = createAbstraction<IEncryption>("Encryption");

export namespace Encryption {
    export type Interface = IEncryption;
}

export interface IEncryptionKeyCache {
    getOrDerive(passphrase: string, salt: string, keyLength: number): Buffer;
}

/**
 * Derives encryption keys and keeps them. Deriving a key runs scrypt, which costs tens of
 * milliseconds of CPU on purpose, so the key is derived once instead of on every request.
 */
export const EncryptionKeyCache = createAbstraction<IEncryptionKeyCache>("EncryptionKeyCache");

export namespace EncryptionKeyCache {
    export type Interface = IEncryptionKeyCache;
}
