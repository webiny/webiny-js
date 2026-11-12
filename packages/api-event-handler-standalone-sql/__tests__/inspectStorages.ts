import type { Abstraction, Container } from "@webiny/di";
import { createDecorator } from "@webiny/di";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { GetCredentialByEmailStorageOperation } from "@webiny/self-hosted-auth";

type Storages = [string, Abstraction<unknown>][];

/** The storages of the API on the standalone server, on either SQL storage. */
export const STORAGES: Storages = [
    ["core", ApiCoreStorageOperationsFactory],
    ["auditLogs", AuditLogsStorage],
    ["websockets", ConnectionRegistry],
    ["login", GetCredentialByEmailStorageOperation]
];

/** Plus folder-level permissions on SQLite (on Postgres, ACO is the folder catalog module). */
export const SQLITE_STORAGES: Storages = [...STORAGES, ["aco", FlpStorageOperations]];

export interface ContainerReport {
    /** The storages the root container resolves. */
    inRoot: string[];
    /** The storages the request container resolves, with an extension's decorator applied. */
    inRequest: string[];
}

const PROBED = Symbol("probed");

class StorageProbe {
    public constructor(decoratee: unknown) {
        const storage = decoratee as object;
        return new Proxy(storage, {
            get: (target, key) => (key === PROBED ? true : Reflect.get(target, key))
        });
    }
}

const resolves = (container: Container, abstraction: Abstraction<unknown>): unknown => {
    try {
        return container.resolve(abstraction);
    } catch {
        return undefined;
    }
};

/*
 * The root container of a request's container. @webiny/di keeps it private; the test reads it to
 * check what the root holds. The schema setup at start applies the extensions in a container of its
 * own, with no parent: that one isn't a request's.
 */
const rootOf = (container: Container): Container | undefined => {
    return (container as unknown as { parent?: Container }).parent;
};

/**
 * An extension that reports, for each request container it is applied in (every request, and every
 * event the server dispatches), which storages its root and its own container resolve. It decorates each
 * storage, as a project extension can, and reports a request's storage only if the decorator reached
 * it.
 */
export const createStorageInspector = (storages: Storages) => {
    const reports: ContainerReport[] = [];
    const extension = createRegisterExtensionPlugin(({ container }) => {
        for (const [, abstraction] of storages) {
            container.registerDecorator(
                createDecorator({ abstraction, decorator: StorageProbe, dependencies: [] })
            );
        }
        const root = rootOf(container);
        if (!root) {
            return;
        }
        const report: ContainerReport = { inRoot: [], inRequest: [] };
        for (const [name, abstraction] of storages) {
            if (resolves(root, abstraction)) {
                report.inRoot.push(name);
            }
            const storage = resolves(container, abstraction) as Record<symbol, unknown> | undefined;
            if (storage?.[PROBED] === true) {
                report.inRequest.push(name);
            }
        }
        reports.push(report);
    });
    return { extension, reports };
};
