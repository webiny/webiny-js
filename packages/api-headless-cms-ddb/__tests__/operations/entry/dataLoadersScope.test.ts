import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { FieldSortingRegistry } from "@webiny/api-headless-cms-storage";
import { HeadlessCmsDdbFeature } from "~/index.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";

/**
 * Mirrors the Lambda handler: storage is registered once in a long-lived root container, and every
 * request runs in its own child container with nothing storage-related registered in it.
 */
const createRoot = () => {
    const root = new Container();
    const documentClient = getDocumentClient();
    DynamoDBCoreFeature.register(root, { documentClient });
    HeadlessCmsDdbFeature.register(root);
    return root;
};

describe("per-request storage state", () => {
    it("shares one DataLoaders instance within a request and a new one per request", () => {
        const root = createRoot();
        const first = root.createChildContainer();
        const second = root.createChildContainer();

        const firstLoaders = first.resolve(CmsDdbDataLoaders);
        const firstLoadersAgain = first.resolve(CmsDdbDataLoaders);
        const secondLoaders = second.resolve(CmsDdbDataLoaders);
        const rootLoaders = root.resolve(CmsDdbDataLoaders);

        expect(firstLoadersAgain).toBe(firstLoaders);
        expect(secondLoaders).not.toBe(firstLoaders);
        expect(rootLoaders).not.toBe(firstLoaders);
    });

    it("gives every request its own filter registries", () => {
        const root = createRoot();
        const first = root.createChildContainer();
        const second = root.createChildContainer();

        const firstRegistry = first.resolve(FieldSortingRegistry);
        const secondRegistry = second.resolve(FieldSortingRegistry);

        expect(first.resolve(FieldSortingRegistry)).toBe(firstRegistry);
        expect(secondRegistry).not.toBe(firstRegistry);
    });
});
