import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import {
    ApiCoreStorageOperationsFactory,
    registerApiCoreStorageOperations,
    RequestStorage
} from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { registerApiRequestStack } from "~/registerApiRequestStack.js";

// Registration only: nothing here runs a storage operation.
const storageOperations = {
    usersStorageOperations: {},
    tenancyStorageOperations: {},
    securityStorageOperations: {},
    keyValueStorageOperations: {}
} as unknown as ApiCoreStorageOperations;

describe("registerApiRequestStack", () => {
    it("registers every RequestStorage in the request's container before any feature", async () => {
        const root = new Container();
        const registeredIn: Container[] = [];
        const storages = ["core", "login"].map(name => {
            const storage: RequestStorage.Interface = {
                register(container) {
                    registeredIn.push(container);
                    if (name === "core") {
                        // `ApiCoreFeature` resolves it while it registers, so it must come first.
                        registerApiCoreStorageOperations(container, storageOperations);
                    }
                }
            };
            return storage;
        });
        for (const storage of storages) {
            root.registerInstance(RequestStorage, storage);
        }

        const request = root.createChildContainer();
        await registerApiRequestStack(request, { extensions: () => [] });

        expect(registeredIn).toEqual([request, request]);
        expect(request.resolve(ApiCoreStorageOperationsFactory).create()).toBe(storageOperations);
        expect(() => root.resolve(ApiCoreStorageOperationsFactory)).toThrow();
    });

    // The DynamoDB variants: their storage is in the root, and they register no RequestStorage.
    it("builds a request on the root's storage when no RequestStorage is registered", async () => {
        const root = new Container();
        registerApiCoreStorageOperations(root, storageOperations);

        const request = root.createChildContainer();
        await registerApiRequestStack(request, { extensions: () => [] });

        expect(request.resolveAll(RequestStorage)).toEqual([]);
        expect(request.resolve(ApiCoreStorageOperationsFactory).create()).toBe(storageOperations);
    });
});
