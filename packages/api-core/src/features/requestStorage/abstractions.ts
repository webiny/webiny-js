import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";

export interface IRequestStorage {
    /**
     * Registers the storage of a part of the API (core, audit logs, websockets, login) in a request
     * container. Runs before any domain feature registers, so the features find it there.
     */
    register(container: Container): void | Promise<void>;
}

/**
 * The storage a request runs on. A storage registers one implementation per part that owns
 * per-request storage in the root container, once per process; every request container then gets
 * those storages registered first, before the domain features (`registerApiRequestStack`). Several
 * implementations can be registered: each part (the SQL storage, the standalone server's login)
 * brings its own.
 *
 * The root keeps only what outlives a request (the connection, its settings), so a request's
 * storages always come from its own container. A storage that registers its storages in the root
 * instead (the DynamoDB variants) registers none of these.
 */
export const RequestStorage = createAbstraction<IRequestStorage>("Core/RequestStorage");

export namespace RequestStorage {
    export type Interface = IRequestStorage;
}
