import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { HeadlessCmsDdbFeature } from "~/index.js";
import { HeadlessCmsDdbRequestFeature } from "~/index.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";

/**
 * Mirrors the Lambda handler: storage is registered once in a long-lived root container, and every
 * request runs in its own child container.
 */
const createRoot = () => {
    const root = new Container();
    const documentClient = getDocumentClient();
    DynamoDBCoreFeature.register(root, { documentClient });
    HeadlessCmsDdbFeature.register(root);
    return root;
};

const createRequest = (root: Container) => {
    const request = root.createChildContainer();
    HeadlessCmsDdbRequestFeature.register(request);
    return request;
};

describe("entry DataLoaders scope", () => {
    it("does not register the DataLoaders in the root container", () => {
        const root = createRoot();

        expect(() => root.resolve(CmsDdbDataLoaders)).toThrow();
    });

    it("shares one DataLoaders instance within a request and a new one per request", () => {
        const root = createRoot();
        const first = createRequest(root);
        const second = createRequest(root);

        const firstLoaders = first.resolve(CmsDdbDataLoaders);
        const firstLoadersAgain = first.resolve(CmsDdbDataLoaders);
        const secondLoaders = second.resolve(CmsDdbDataLoaders);

        expect(firstLoadersAgain).toBe(firstLoaders);
        expect(secondLoaders).not.toBe(firstLoaders);
    });
});
