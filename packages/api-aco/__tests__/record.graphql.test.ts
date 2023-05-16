import prettier from "prettier";
import { createDefaultAppsSchemaSnapshot } from "./snapshots/defaultAppsSchema";
import { createCustomAppsSchemaSnapshot } from "./snapshots/customAppsSchema";
import { createMockAcoApp, createMockApp, MOCK_APP_NAME } from "./mocks/app";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { useHandler } from "./utils/useHandler";
import { IntrospectionField, IntrospectionInterfaceType } from "graphql";
import { createAcoApp, createAcoAppModifier } from "~/plugins";
import { createAppSchema } from "~/record/graphql/createAppSchema";
import { CmsFieldTypePlugins, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

interface GraphQlType {
    kind: Uppercase<string>;
    name: string;
    fields: IntrospectionField[];
    interfaces: IntrospectionInterfaceType[];
}

const getTypesFromResult = (result: any): GraphQlType[] => {
    return result.data?.__schema?.types as GraphQlType[];
};

describe("record graphql generator", () => {
    it("should be no graphql schema when no apps are present", async () => {
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

    it("should generate the default graphql schema when an app is present - via method", async () => {
        const { handler } = useHandler({
            plugins: [
                createMockAcoApp({
                    apiName: "Webiny"
                })
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

        const sdl = context.aco
            .listApps()
            .map(app =>
                createAppSchema({
                    models,
                    plugins,
                    app
                })
            )
            .join("\n");
        expect(sdl).not.toBeNull();
        const schema = prettier.format(sdl.trim(), { parser: "graphql" });
        const snapshot = prettier.format(createDefaultAppsSchemaSnapshot().trim(), {
            parser: "graphql"
        });
        expect(schema).toEqual(snapshot);
    });

    it("should generate a custom graphql schema when an app is present - via method", async () => {
        const { handler } = useHandler({
            plugins: [
                createMockAcoApp({
                    apiName: "CustomTestingApp"
                }),
                createAcoAppModifier(MOCK_APP_NAME, async ({ addField }) => {
                    addField({
                        id: "customWebinyTextField",
                        fieldId: "customWebinyTextField",
                        label: "Custom Webiny Text Field",
                        type: "text",
                        storageId: "text@customWebinyTextField"
                    });
                    addField({
                        id: "customWebinyNumberField",
                        fieldId: "customWebinyNumberField",
                        label: "Custom Webiny Number Field",
                        type: "number",
                        storageId: "text@customWebinyNumberField"
                    });
                })
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

        const sdl = context.aco
            .listApps()
            .map(app =>
                createAppSchema({
                    models,
                    plugins,
                    app
                })
            )
            .join("\n");
        expect(sdl).not.toBeNull();
        const schema = prettier.format(sdl.trim(), { parser: "graphql" });
        const snapshot = prettier.format(createCustomAppsSchemaSnapshot().trim(), {
            parser: "graphql"
        });
        expect(schema).toEqual(snapshot);
    });
});
