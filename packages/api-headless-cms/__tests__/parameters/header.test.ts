import { describe, expect, it } from "vitest";
import { createHeaderParameterPlugin } from "~/parameters";
import { ApiEndpoint, CmsContext } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

const TYPE = "x-webiny-cms-endpoint";

const createContext = (type?: ApiEndpoint | null): CmsContext => {
    return {
        request: {
            cookies: [],
            body: "",
            method: "POST",
            headers: {
                [TYPE]: type
            }
        }
    } as unknown as CmsContext;
};

const correctTestCases: [ApiEndpoint][] = [["manage"], ["read"], ["preview"]];

describe("Header Parameter Plugin", () => {
    it.each(correctTestCases)("should properly extract type from headers - %s", async type => {
        const plugin = createHeaderParameterPlugin();

        const result = await plugin.getParameters(createContext(type));

        expect(result).toEqual({
            type
        });
    });

    it("should return null on missing both headers - code will move onto the next available plugin", async () => {
        const plugin = createHeaderParameterPlugin();

        const result = await plugin.getParameters(createContext());

        expect(result).toBeNull();
    });

    it("should load combined schema — both system and CMS queries available", async () => {
        const { isInstalledQuery, listContentModelGroupsQuery } = useGraphQLHandler();

        // In the new architecture, the handler uses a combined schema that includes
        // both api-core (system) and CMS (listContentModelGroups) operations.

        const [isInstalledResponse] = await isInstalledQuery();

        expect(isInstalledResponse).toEqual({
            data: {
                system: {
                    isSystemInstalled: {
                        data: false
                    }
                }
            }
        });

        const [listGroupsResponse] = await listContentModelGroupsQuery();

        expect(listGroupsResponse).toEqual({
            data: {
                listContentModelGroups: {
                    data: [],
                    error: null
                }
            }
        });
    });

    it("should load combined schema when type is passed explicitly", async () => {
        const { isInstalledQuery, listContentModelGroupsQuery } = useGraphQLHandler({
            path: "manage"
        });

        // Both system (api-core) and CMS queries are available in the combined schema.

        const [isInstalledResponse] = await isInstalledQuery();

        expect(isInstalledResponse).toEqual({
            data: {
                system: {
                    isSystemInstalled: {
                        data: false
                    }
                }
            }
        });

        const [listGroupsResponse] = await listContentModelGroupsQuery();

        expect(listGroupsResponse).toEqual({
            data: {
                listContentModelGroups: {
                    data: [],
                    error: null
                }
            }
        });
    });
});
