import prettier from "prettier";
import { createAppsSchemaSnapshot } from "./snapshots/appsSchema";
import { createMockApp } from "./mocks/app";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { useHandler } from "./utils/useHandler";
import { IntrospectionField, IntrospectionInterfaceType } from "graphql";
import { createAcoApp } from "~/plugins";
import { createAppsSchema } from "~/record/graphql/createAppsSchema";
import { CmsFieldTypePlugins, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

jest.retryTimes(0);

interface GraphQlType {
    kind: Uppercase<string>;
    name: string;
    description: string | null;
    inputFields: null;
    fields: IntrospectionField[];
    interfaces: IntrospectionInterfaceType[];
    enumValues: null;
    possibleTypes: null;
}

const getTypesFromResult = (result: any): GraphQlType[] => {
    return result.data?.__schema?.types as GraphQlType[];
};

describe("record graphql generator", () => {
    it.skip("should be no graphql schema when no apps are present", async () => {
        const { introspect } = useGraphQlHandler();
        const [result] = await introspect();

        const expected = {
            AcoQuery: {
                kind: "OBJECT",
                name: "AcoQuery",
                description: null,
                inputFields: null,
                interfaces: [],
                enumValues: null,
                possibleTypes: null
            },
            AcoMutation: {
                kind: "OBJECT",
                name: "AcoMutation",
                description: null,
                inputFields: null,
                interfaces: [],
                enumValues: null,
                possibleTypes: null
            },
            SearchQuery: {
                kind: "OBJECT",
                name: "SearchQuery",
                description: null,
                inputFields: null,
                interfaces: [],
                enumValues: null,
                possibleTypes: null
            },
            SearchMutation: {
                kind: "OBJECT",
                name: "SearchMutation",
                description: null,
                inputFields: null,
                interfaces: [],
                enumValues: null,
                possibleTypes: null
            }
        };

        const types = getTypesFromResult(result);

        const checks = ["AcoQuery", "AcoMutation", "SearchQuery", "SearchMutation"] as const;
        for (const check of checks) {
            const type = types.find(t => t.name === check);
            expect(type).toMatchObject({
                kind: "OBJECT",
                name: expect.any(String),
                description: null,
                inputFields: null,
                interfaces: [],
                enumValues: null,
                possibleTypes: null
            });
            expect(type).toMatchObject(expected[check]);
        }
        const SearchQuery = types.find(t => t.name === "SearchQuery");
        expect(SearchQuery).toMatchObject({
            kind: "OBJECT",
            name: expect.any(String),
            description: null,
            inputFields: null,
            interfaces: [],
            fields: [
                {
                    name: "_empty"
                }
            ],
            enumValues: null,
            possibleTypes: null
        });
        expect(SearchQuery?.fields).toHaveLength(1);
    });

    it("should generate graphql schema when an app is present - introspection", async () => {
        const { introspect } = useGraphQlHandler({
            plugins: [createAcoApp(createMockApp())]
        });
        const [result] = await introspect();

        const types = getTypesFromResult(result);

        const SearchQuery = types.find(t => t.name === "SearchQuery");
        expect(SearchQuery).toMatchObject({
            kind: "OBJECT",
            name: expect.any(String),
            description: null,
            inputFields: null,
            interfaces: [],
            fields: [
                {
                    name: "_empty"
                },
                {
                    name: "getAcoSearchRecordMockAppApiName"
                },
                {
                    name: "listAcoSearchRecordMockAppApiName"
                }
            ],
            enumValues: null,
            possibleTypes: null
        });
        expect(SearchQuery?.fields).toHaveLength(3);

        const SearchMutation = types.find(t => t.name === "SearchMutation");
        expect(SearchMutation).toMatchObject({
            kind: "OBJECT",
            name: expect.any(String),
            description: null,
            inputFields: null,
            interfaces: [],
            fields: [
                {
                    name: "_empty"
                },
                {
                    name: "createAcoSearchRecordMockAppApiName"
                },
                {
                    name: "updateAcoSearchRecordMockAppApiName"
                },
                {
                    name: "deleteAcoSearchRecordMockAppApiName"
                }
            ],
            enumValues: null,
            possibleTypes: null
        });
        expect(SearchMutation?.fields).toHaveLength(4);
    });

    it("should generate graphql schema when an app is present - method", async () => {
        const { handler } = useHandler({
            plugins: [
                createAcoApp(
                    createMockApp({
                        apiName: "Webiny"
                    })
                )
            ]
        });

        const context = await handler();
        expect(context.aco.listApps()).toHaveLength(1);

        const plugins = context.plugins
            .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
            .reduce<CmsFieldTypePlugins>((fields, plugin) => {
                fields[plugin.fieldType] = plugin;
                return fields;
            }, {});

        const models = await context.security.withoutAuthorization(async () => {
            return (await context.cms.listModels()).filter(model => !model.isPrivate);
        });

        const sdl = createAppsSchema({
            models,
            plugins,
            apps: context.aco.listApps()
        });
        expect(sdl).not.toBeNull();
        const schema = prettier.format(sdl.trim(), { parser: "graphql" });
        const snapshot = prettier.format(createAppsSchemaSnapshot().trim(), { parser: "graphql" });
        expect(schema).toEqual(snapshot);
    });
});
