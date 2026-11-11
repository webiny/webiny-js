import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createDecorator } from "@webiny/di";
import type { Abstraction } from "@webiny/di";
import { FlpStorageOperations } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { createServer } from "./createServer.js";

/**
 * ACO, audit logs and websockets register their storage in the root container (ACO and audit logs as
 * instances, websockets as a transient class), while extensions register per request. With
 * @webiny/di 2.0, decorators on transient, factory and instance registrations come from the container
 * that resolves them, so an extension's decorator reaches this storage too.
 */
const PROBED = Symbol("probed");

class StorageProbe {
    public constructor(decoratee: unknown) {
        const storage = decoratee as object;
        return new Proxy(storage, {
            get: (target, key) => (key === PROBED ? true : Reflect.get(target, key))
        });
    }
}

const createProbe = (abstraction: Abstraction<unknown>) => {
    return createDecorator({ abstraction, decorator: StorageProbe, dependencies: [] });
};

const isProbed = (value: unknown): boolean => {
    const record = value as Record<symbol, unknown>;
    return record[PROBED] === true;
};

describe("api-event-handler-standalone-sql — root storage decorators", () => {
    it("applies an extension's decorators to ACO, audit logs and websockets storage", async () => {
        const storages = [FlpStorageOperations, AuditLogsStorage, ConnectionRegistry];
        const runs: unknown[][] = [];

        /*
         * Extensions run once per child container: for the request below, and also for the
         * scheduler's boot recovery, which the server dispatches in-process on start. So the test
         * checks every run rather than counting them.
         */
        const extension = createRegisterExtensionPlugin(({ container }) => {
            for (const abstraction of storages) {
                const probe = createProbe(abstraction);
                container.registerDecorator(probe);
            }

            const resolved: unknown[] = [];
            for (const abstraction of storages) {
                const storage = container.resolve(abstraction);
                resolved.push(storage);
            }
            runs.push(resolved);
        });

        const server = await createServer(() => [extension]);

        let runsBeforeRequest = 0;
        try {
            runsBeforeRequest = runs.length;
            await server.graphql("{ __typename }");
        } finally {
            await server.close();
        }

        expect(runs.length).toBeGreaterThan(runsBeforeRequest);
        for (const resolved of runs) {
            expect(resolved.map(isProbed)).toEqual([true, true, true]);
        }
    });
});
