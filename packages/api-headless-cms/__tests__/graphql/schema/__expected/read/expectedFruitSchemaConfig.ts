export const expectedFruitSchemaConfig = JSON.parse(
    JSON.stringify({
        assumeValid: false,
        astNode: {
            kind: "SchemaDefinition",
            operationTypes: [
                {
                    kind: "OperationTypeDefinition",
                    operation: "query",
                    type: {
                        kind: "NamedType",
                        name: {
                            kind: "Name",
                            loc: {
                                end: 11476,
                                start: 11471
                            },
                            value: "Query"
                        }
                    }
                },
                {
                    kind: "OperationTypeDefinition",
                    operation: "mutation",
                    type: {
                        kind: "NamedType",
                        name: {
                            kind: "Name",
                            loc: {
                                end: 311,
                                start: 303
                            },
                            value: "Mutation"
                        }
                    }
                }
            ]
        },
        description: undefined,
        directives: ["@include", "@skip", "@deprecated", "@specifiedBy", "@oneOf"],
        extensionASTNodes: [],
        extensions: {},
        mutation: "Mutation",
        query: "Query",
        subscription: undefined,
        types: [
            "CmsIdentity",
            "String",
            "CmsError",
            "CmsCursors",
            "CmsListMeta",
            "Boolean",
            "Int",
            "CmsDeleteEntryOptions",
            "CmsDeleteResponse",
            "CmsDeleteMultipleDataResponse",
            "ID",
            "CmsDeleteMultipleResponse",
            "CmsBooleanResponse",
            "WbyAcoLocation",
            "WbyAcoLocationInput",
            "WbyAcoLocationWhereInput",
            "SkipValidatorEnum",
            "CreateCmsEntryOptionsInput",
            "CreateRevisionCmsEntryOptionsInput",
            "UpdateCmsEntryOptionsInput",
            "CmsIdentityInput",
            "CmsEntryValidationResponseData",
            "CmsEntryValidationResponse",
            "CmsEntryStateType",
            "CmsEntryState",
            "ListWhereInputCmsEntryState",
            "RevisionId",
            "JSON",
            "Long",
            "RefInput",
            "Number",
            "Any",
            "Date",
            "DateTime",
            "DateTimeZ",
            "Time",
            "Query",
            "Mutation",
            "CmsEntryStatusType",
            "CmsFieldValidation",
            "CmsFieldRenderer",
            "CmsPredefinedValue",
            "CmsPredefinedValues",
            "CmsContentModelField",
            "CmsContentModel",
            "CmsContentModelResponse",
            "CmsContentModelListResponse",
            "CmsContentModelGroup",
            "RefFieldWhereInput",
            "FruitApiModelValues",
            "FruitApiModel",
            "FruitApiModelGetWhereInputValues",
            "FruitApiModelGetWhereInput",
            "FruitApiModelListWhereInputValues",
            "FruitApiModelListWhereInput",
            "FruitApiModelListSorter",
            "FruitApiModelResponse",
            "FruitApiModelListResponse",
            "__Schema",
            "__Type",
            "__TypeKind",
            "__Field",
            "__InputValue",
            "__EnumValue",
            "__Directive",
            "__DirectiveLocation"
        ]
    })
);
