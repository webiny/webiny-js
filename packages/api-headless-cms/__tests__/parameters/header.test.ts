import { createHeaderParameterPlugin } from "~/parameters";
import { ApiEndpoint, CmsContext } from "~/types";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { ContextPlugin } from "@webiny/handler";
import { TestContext } from "../utils/types";

const TYPE = "x-webiny-cms-endpoint";
const LOCALE = "x-webiny-cms-locale";

const createContext = (type?: ApiEndpoint | null, locale?: string | null): CmsContext => {
    return {
        http: {
            request: {
                cookies: [],
                body: "",
                method: "POST",
                headers: {
                    [TYPE]: type,
                    [LOCALE]: locale
                }
            }
        }
    } as unknown as CmsContext;
};

const correctTestCases: [ApiEndpoint, string][] = [
    ["manage", "en-US"],
    ["read", "en"],
    ["preview", "de-DE"]
];

describe("Header Parameter Plugin", () => {
    it.each(correctTestCases)(
        "should properly extract type and locale from headers - %s, %s",
        async (type, locale) => {
            const plugin = createHeaderParameterPlugin();

            const result = await plugin.getParameters(createContext(type, locale));

            expect(result).toEqual({
                type,
                locale
            });
        }
    );

    it("should return null on missing both headers - code will move onto the next available plugin", async () => {
        const plugin = createHeaderParameterPlugin();

        const result = await plugin.getParameters(createContext());

        expect(result).toBeNull();
    });

    it("should throw error on missing type header", async () => {
        const plugin = createHeaderParameterPlugin();

        let error: Error | undefined;
        try {
            await plugin.getParameters(createContext(undefined, "en-US"));
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(`There is a "${LOCALE}" header but no "${TYPE}".`);
    });

    it("should throw error on missing locale header", async () => {
        const plugin = createHeaderParameterPlugin();

        let error: Error | undefined;
        try {
            await plugin.getParameters(createContext("manage"));
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(`There is a "${TYPE}" header but no "${LOCALE}".`);
    });

    it("should load main schema when no type or locale headers passed", async () => {
        const { isInstalledQuery, listContentModelGroupsQuery } = useGraphQLHandler({
            plugins: [
                new ContextPlugin<TestContext>(async context => {
                    context.http = {
                        ...context.http,
                        request: {
                            ...context.http.request,
                            headers: {}
                        }
                    };
                })
            ]
        });

        /**
         * We should be able to run isInstalledQuery
         */
        const [isInstalledResponse] = await isInstalledQuery();

        expect(isInstalledResponse).toEqual({
            data: {
                cms: {
                    version: null
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

    it("should load content schema when type and locale headers passed", async () => {
        const { isInstalledQuery, listContentModelGroupsQuery } = useGraphQLHandler({
            topPlugins: [
                new ContextPlugin<TestContext>(async context => {
                    context.http = {
                        ...(context.http || {}),
                        request: {
                            ...(context.http?.request || {}),
                            path: {
                                base: "",
                                query: {},
                                parameters: undefined
                            } as any,
                            headers: {
                                [TYPE]: "manage",
                                [LOCALE]: "en-US"
                            }
                        }
                    };
                })
            ]
        });

        /**
         * We should not be able to run isInstalledQuery
         */
        const [isInstalledResponse] = await isInstalledQuery();

        expect(isInstalledResponse).toMatchObject({
            errors: [
                {
                    message: `Cannot query field "cms" on type "Query".`
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
