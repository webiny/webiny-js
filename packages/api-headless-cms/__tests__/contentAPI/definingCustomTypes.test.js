import useContentHandler from "./utils/useContentHandler";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import { i18nFieldInput } from "@webiny/api-headless-cms/content/plugins/graphqlTypes/i18nFieldInput";
import { i18nFieldType } from "@webiny/api-headless-cms/content/plugins/graphqlTypes/i18nFieldType";
import gql from "graphql-tag";
import { Database } from "@commodo/fields-storage-nedb";

describe("defining custom GQL types should work on both READ and MANAGE API ", () => {
    const database = new Database();
    const customFieldsPlugins = [
        {
            name: "cms-model-field-to-graphql-custom",
            type: "cms-model-field-to-graphql",
            fieldType: "custom",
            manage: {
                createSchema() {
                    return {
                        typeDefs: gql`
                            ${i18nFieldInput("CustomManageI18NRefInput", "RefInput")}
                            ${i18nFieldType("CustomManageI18NString", "String")}
                            type CustomManageInt {
                                value: Int
                            }
                        `
                    };
                }
            },
            read: {
                createSchema() {
                    return {
                        typeDefs: gql`
                            ${i18nFieldInput("CustomReadI18NRefInput", "RefInput")}
                            ${i18nFieldType("CustomReadI18NString", "String")}
                            type CustomReadInt {
                                value: Int
                            }
                        `
                    };
                }
            }
        }
    ];

    const { environment: environmentManage } = useContentHandler({
        database,
        type: "manage",
        plugins: customFieldsPlugins
    });

    const { environment: environmentRead } = useContentHandler({
        database,
        type: "read",
        plugins: customFieldsPlugins
    });

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should unlock all fields if when all content entries are deleted", async () => {
        const { invoke: invokeManage } = environmentManage(initial.environment.id);
        const [resultsManage] = await invokeManage({
            body: {
                query: GET_SCHEMA
            }
        });

        const { invoke: invokeRead } = environmentRead(initial.environment.id);
        const [resultsRead] = await invokeRead({
            body: {
                query: GET_SCHEMA
            }
        });

        const manageTypes = [
            "CustomManageI18NRefInputLocalizedInput",
            "CustomManageI18NRefInputInput",
            "CustomManageI18NRefInputListLocalizedInput",
            "CustomManageI18NRefInputListInput",
            "CustomManageI18NStringLocalized",
            "CustomManageI18NString",
            "CustomManageI18NStringListLocalized",
            "CustomManageI18NStringList",
            "CustomManageInt"
        ];

        const readTypes = [
            "CustomReadI18NRefInputLocalizedInput",
            "CustomReadI18NRefInputInput",
            "CustomReadI18NRefInputListLocalizedInput",
            "CustomReadI18NRefInputListInput",
            "CustomReadI18NStringLocalized",
            "CustomReadI18NString",
            "CustomReadI18NStringListLocalized",
            "CustomReadI18NStringList",
            "CustomReadInt"
        ];

        const expectTypeExists = (schema, type, exists) => {
            const found = schema.types.find(item => item.name === type);
            const assertion = exists ? "toBeTruthy" : "toBeFalsy";
            expect(found)[assertion]();
        };

        for (let i = 0; i < manageTypes.length; i++) {
            expectTypeExists(resultsManage.data.__schema, manageTypes[i], true);
        }

        for (let i = 0; i < readTypes.length; i++) {
            expectTypeExists(resultsManage.data.__schema, readTypes[i], false);
        }

        for (let i = 0; i < manageTypes.length; i++) {
            expectTypeExists(resultsRead.data.__schema, manageTypes[i], false);
        }

        for (let i = 0; i < readTypes.length; i++) {
            expectTypeExists(resultsRead.data.__schema, readTypes[i], true);
        }
    });
});

const GET_SCHEMA = /* GraphQL */ `
    query LearnAboutSchema {
        __schema {
            types {
                name
                kind
            }
            queryType {
                fields {
                    name
                    description
                }
            }
        }
    }
`;
