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

export interface IEncryptionConfig {
    /** `null` turns encryption off: values are stored as given. */
    readonly passphrase: string | null;
    readonly salt: string;
    readonly algorithm: string;
}

/**
 * Where `Encryption` gets its key material. The default reads the `EncryptionPassphrase`,
 * `EncryptionSalt` and `EncryptionAlgorithm` build params (`<Infra.Crypto.Encryption>`). A hosting
 * type can replace it, e.g. to read the passphrase from env at startup.
 */
export const EncryptionConfig = createAbstraction<IEncryptionConfig>("EncryptionConfig");

export namespace EncryptionConfig {
    export type Interface = IEncryptionConfig;
}
