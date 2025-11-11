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
    it.each(correctTestCases)(
        "should properly extract type from headers - %s",
        async type => {
            const plugin = createHeaderParameterPlugin();

            const result = await plugin.getParameters(createContext(type));

            expect(result).toEqual({
                type
            });
        }
    );

    it("should return null on missing both headers - code will move onto the next available plugin", async () => {
        const plugin = createHeaderParameterPlugin();

        const result = await plugin.getParameters(createContext());

        expect(result).toBeNull();
    });

    it("should load main schema when no type", async () => {
        const { isInstalledQuery, listContentModelGroupsQuery } = useGraphQLHandler();

        /**
         * We should be able to run isInstalledQuery
         */
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
        /**
         * We should not be able to run listContentModelGroupsQuery
         */
        const [listGroupsResponse] = await listContentModelGroupsQuery();

        expect(listGroupsResponse).toMatchObject({
            errors: [
                {
                    message: `Cannot query field "listContentModelGroups" on type "Query".`
                }
            ]
        });
    });

    it("should load content schema when type headers passed", async () => {
        const { isInstalledQuery, listContentModelGroupsQuery } = useGraphQLHandler({
            path: "manage"
        });

        /**
         * We should not be able to run isInstalledQuery
         */
        const [isInstalledResponse] = await isInstalledQuery({
            headers: {
                [TYPE]: "manage"
            }
        });

        expect(isInstalledResponse).toMatchObject({
            errors: [
                {
                    message: `Cannot query field "system" on type "Query".`
                }
            ]
        });
        /**
         * We should be able to run listContentModelGroupsQuery
         */
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
