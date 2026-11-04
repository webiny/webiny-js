import { beforeEach, describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { createPermissions } from "../testHelpers/helpers";
import type { PermissionsArg } from "../testHelpers/helpers";
import { setupGroupAndModels } from "../testHelpers/setup";

/*
 * Entry listing only reaches OpenSearch when the storage has it. Plain DynamoDB lists from the
 * table, so it never produces a `cms.os.list` entry.
 */
const usesOpenSearch = (process.env.WEBINY_STORAGE || "").split(",").some(storage => {
    return storage.endsWith("-os");
});

const createHandler = (permissions: PermissionsArg[]) => {
    return useCategoryManageHandler({
        path: "manage",
        permissions: [...createPermissions(), ...permissions]
    });
};

describe("debugger", () => {
    const setup = createHandler([]);

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: setup,
            models: ["category"]
        });
    });

    it.runIf(usesOpenSearch)(
        "should attach captured OpenSearch listings for an identity with the permission",
        async () => {
            const { listCategories } = createHandler([{ name: "dev-tools.debug" }]);

            const [response] = await listCategories();

            expect(response.errors).toBeUndefined();
            expect(response.data.listCategories.error).toBeNull();

            const debug = (response as any).extensions?.debug;
            expect(debug).toMatchObject({
                enabled: true,
                url: "/cms/manage",
                namespaces: ["*"],
                dropped: 0,
                truncated: false
            });
            expect(typeof debug.requestId).toBe("string");
            expect(debug.requestId.length).toBeGreaterThan(0);

            /*
             * The CMS resolver runs its own nested GraphQL execution. Capturing at the route means
             * the whole request still yields exactly one session, on the response the client gets.
             */
            expect(debug.entries.length).toBeGreaterThan(0);
            for (const entry of debug.entries) {
                expect(entry.namespace).toBe("cms.os.list");
                expect(entry.data).toMatchObject({
                    index: expect.any(String),
                    query: expect.any(Object),
                    tookMs: expect.any(Number)
                });
            }
        }
    );

    it.runIf(usesOpenSearch)("should honour the namespace filter in the header", async () => {
        const { listCategories } = createHandler([{ name: "dev-tools.debug" }]);

        const [excluded] = await listCategories({
            headers: {
                "x-webiny-debug": "*,!cms.os.*"
            }
        });

        expect(excluded.errors).toBeUndefined();
        // Nothing matched the filter, so there is nothing to attach.
        expect((excluded as any).extensions?.debug).toBeUndefined();

        const [included] = await listCategories({
            headers: {
                "X-Webiny-Debug": "cms.os.*"
            }
        });

        const debug = (included as any).extensions?.debug;
        expect(debug.namespaces).toEqual(["cms.os.*"]);
        expect(debug.entries.length).toBeGreaterThan(0);
    });

    it("should attach nothing for an identity without the permission", async () => {
        const { listCategories } = createHandler([]);

        const [response] = await listCategories({
            headers: {
                "x-webiny-debug": "1"
            }
        });

        expect(response.errors).toBeUndefined();
        expect(response.data.listCategories.error).toBeNull();
        expect((response as any).extensions).toBeUndefined();
    });

    it("should not treat Dev Tools full access as the permission", async () => {
        const { listCategories } = createHandler([{ name: "dev-tools.*" }]);

        const [response] = await listCategories();

        expect(response.errors).toBeUndefined();
        expect((response as any).extensions).toBeUndefined();
    });
});
