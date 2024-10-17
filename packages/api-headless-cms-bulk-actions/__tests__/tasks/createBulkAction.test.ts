import { IntrospectionField, IntrospectionInterfaceType } from "graphql";
import { useGraphQlHandler } from "~tests/context/useGraphQLHandler";
import { createBulkAction } from "~/plugins";
import { createMockModels, createPrivateMockModels } from "~tests/mocks";
import { createBulkActionEntriesTasks } from "~/tasks";

interface GraphQlType {
    kind: Uppercase<string>;
    name: string;
    fields: IntrospectionField[];
    interfaces: IntrospectionInterfaceType[];
}

const getTypesFromResult = (result: any): GraphQlType[] => {
    return result.data?.__schema?.types as GraphQlType[];
};

const getEnumValues = (names: string[]) => {
    return names.map(name => ({
        name,
        description: null,
        isDeprecated: false,
        deprecationReason: null
    }));
};

const defaultBulkActionsEnumNames = [
    "_empty",
    "Delete",
    "MoveToFolder",
    "MoveToTrash",
    "Publish",
    "Unpublish",
    "Restore"
];

describe("createBulkAction", () => {
    it("should create GraphQL schema with default bulk actions ENUMS", async () => {
        const { introspect } = useGraphQlHandler({
            plugins: [...createMockModels(), createBulkActionEntriesTasks()]
        });

        const [result] = await introspect();
        const types = getTypesFromResult(result);

        const checks = ["BulkActionCarName", "BulkActionAuthorName"] as const;
        for (const check of checks) {
            const type = types.find(t => t.name === check);
            expect(type).toMatchObject({
                kind: "ENUM",
                name: expect.any(String),
                enumValues: expect.arrayContaining(getEnumValues(defaultBulkActionsEnumNames)),
                description: null,
                inputFields: null,
                interfaces: null,
                possibleTypes: null
            });
        }
    });

    it("should NOT create bulk actions ENUMS in case of a private model", async () => {
        const { introspect } = useGraphQlHandler({
            plugins: [...createPrivateMockModels(), createBulkActionEntriesTasks()]
        });

        const [result] = await introspect();
        const types = getTypesFromResult(result);

        const forbiddens = ["BulkActionPrivateModelName"] as const;
        for (const forbidden of forbiddens) {
            const type = types.find(t => t.name === forbidden);
            expect(type).toBeUndefined();
        }
    });

    it("should update the ENUMS when a new bulk action is created, only for the provided `modelIds`", async () => {
        const dataLoader = jest.fn();
        const dataProcessor = jest.fn();

        const { introspect } = useGraphQlHandler({
            plugins: [
                ...createMockModels(),
                createBulkActionEntriesTasks(),
                createBulkAction({
                    name: "print",
                    dataLoader,
                    dataProcessor,
                    modelIds: ["car"]
                })
            ]
        });

        const [result] = await introspect();
        const types = getTypesFromResult(result);

        const allowed = ["BulkActionCarName"] as const;
        for (const check of allowed) {
            const type = types.find(t => t.name === check);
            expect(type).toMatchObject({
                kind: "ENUM",
                name: expect.any(String),
                enumValues: expect.arrayContaining(
                    getEnumValues([...defaultBulkActionsEnumNames, "Print"])
                ),
                description: null,
                inputFields: null,
                interfaces: null,
                possibleTypes: null
            });
        }

        const forbidden = ["BulkActionAuthorName"] as const;
        for (const check of forbidden) {
            const type = types.find(t => t.name === check);
            expect(type).toMatchObject({
                kind: "ENUM",
                name: expect.any(String),
                enumValues: expect.arrayContaining(getEnumValues([...defaultBulkActionsEnumNames])),
                description: null,
                inputFields: null,
                interfaces: null,
                possibleTypes: null
            });
        }
    });
});
