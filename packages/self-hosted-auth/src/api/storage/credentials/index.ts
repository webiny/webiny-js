/*
 * The credential store, one abstraction per operation. Same arrangement as the reset codes next
 * door, and the same reason: a database package implements and registers each one.
 */
export * from "./types.js";
export * from "./GetCredentialByEmailStorageOperation.js";
export * from "./GetCredentialByUserIdStorageOperation.js";
export * from "./SaveCredentialStorageOperation.js";
export * from "./DeleteCredentialStorageOperation.js";
