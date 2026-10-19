import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { DbRegistryFeature } from "@webiny/db/exports/api/db.js";
import { GraphQLFeature } from "@webiny/api-headless-cms/features/graphql/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { HeadlessCmsDdbEsFeature } from "~/index.js";

/**
 * Mirrors the DDB+OpenSearch Lambda handler: storage and DbRegistry are registered once in the root
 * container, and each request runs in a child container where only the request stack (here, the
 * GraphQL field registry the field indexes depend on) is registered.
 */
const createRoot = () => {
    const root = new Container();
    const documentClient = getDocumentClient();
    DynamoDBCoreFeature.register(root, { documentClient });
    DbRegistryFeature.register(root);
    HeadlessCmsDdbEsFeature.register(root);
    return root;
};

const createRequest = (root: Container) => {
    const request = root.createChildContainer();
    GraphQLFeature.register(request);
    return request;
};

const isCmsItem = (item: DbRegistry.RegistryItem) => item.app === "cms";

describe("DDB+OpenSearch per-request state", () => {
    it("gives every request its own DbRegistry, with the CMS entities registered", () => {
        const root = createRoot();
        const first = createRequest(root);
        const second = createRequest(root);

        const firstRegistry = first.resolve(DbRegistry);
        const secondRegistry = second.resolve(DbRegistry);
        const firstItems = firstRegistry.getItems(isCmsItem);
        const secondItems = secondRegistry.getItems(isCmsItem);

        expect(secondRegistry).not.toBe(firstRegistry);
        expect(firstItems).toHaveLength(2);
        expect(secondItems).toHaveLength(2);
    });

    it("keeps items registered during one request out of the next", () => {
        const root = createRoot();
        const first = createRequest(root);
        const second = createRequest(root);

        const firstRegistry = first.resolve(DbRegistry);
        firstRegistry.register({ item: {}, app: "extension", tags: ["custom"] });
        const secondRegistry = second.resolve(DbRegistry);
        const leaked = secondRegistry.getItems(item => item.app === "extension");

        expect(leaked).toHaveLength(0);
    });

    it("builds the OpenSearch field index registry per request", () => {
        const root = createRoot();
        const first = createRequest(root);
        const second = createRequest(root);

        const firstRegistry = first.resolve(CmsEntryOpenSearchFieldIndexRegistry);
        const secondRegistry = second.resolve(CmsEntryOpenSearchFieldIndexRegistry);

        expect(first.resolve(CmsEntryOpenSearchFieldIndexRegistry)).toBe(firstRegistry);
        expect(secondRegistry).not.toBe(firstRegistry);
    });
});
