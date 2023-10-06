import {
    QueryBuilderPresenter,
    QueryBuilderViewModel
} from "~/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/adapters";
import { FieldDTO, FieldRaw, FieldType, Operation } from "~/components/AdvancedSearch/QueryObject";

describe("QueryBuilderPresenter", () => {
    const modelId = "model-id";
    const defaultFilter = { field: "", value: "", condition: "" };

    const defaultGroup = {
        operation: Operation.AND,
        filters: [defaultFilter]
    };

    const fieldId = "test-field";
    const fieldLabel = "Test Field";
    const fieldType = "text";

    const testFilter = {
        field: "",
        condition: "",
        value: ""
    };

    const testGroup = {
        operation: Operation.AND,
        filters: [testFilter]
    };

    let presenter: QueryBuilderPresenter;
    let viewModel: QueryBuilderViewModel;

    beforeEach(() => {
        const defaultFields: FieldRaw[] = [
            {
                id: fieldId,
                label: fieldLabel,
                type: fieldType
            }
        ];

        presenter = new QueryBuilderPresenter(modelId, defaultFields);
    });

    it("should create QueryBuilderPresenter with `viewModel` definition", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // `viewModel` should have the expected `fields` definition
        expect(viewModel.fields).toEqual([
            {
                label: fieldLabel,
                value: fieldId,
                type: fieldType,
                predefined: expect.any(Array),
                conditions: expect.any(Array)
            }
        ]);

        // `viewModel` should have the expected `queryObject` definition
        expect(viewModel.queryObject).toEqual({
            id: expect.any(String),
            name: "Untitled",
            description: "",
            modelId: modelId,
            operation: "AND",
            groups: [testGroup]
        });

        // `viewModel` should have the expected `invalidFields` definition
        expect(viewModel.invalidFields).toEqual({});
    });

    it("should load a QueryObject into QueryBuilderPresenter", () => {
        const queryObjectDto = {
            id: "any-id",
            name: "Any name",
            description: "Any description",
            operation: Operation.OR,
            groups: [testGroup],
            modelId
        };

        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // let's load a queryObjectDTO
        presenter.updateQueryObject(queryObjectDto);
        expect(viewModel.queryObject).toEqual(queryObjectDto);

        // let's load a nullish queryObjectDTO
        presenter.updateQueryObject(null);
        expect(viewModel.queryObject).toEqual({
            id: expect.any(String),
            name: "Untitled",
            description: "",
            modelId: modelId,
            operation: "AND",
            groups: [testGroup]
        });
    });

    it("should be able to add and delete groups", () => {
        // let's load a queryObjectDTO
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // should only have 1 group, created by default
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([testGroup]);

        presenter.addGroup();

        // should have 2 groups
        expect(viewModel.queryObject.groups.length).toBe(2);
        expect(viewModel.queryObject.groups).toEqual([testGroup, testGroup]);

        const viewModelGroup = viewModel.queryObject.groups[1];

        // let's delete the first group
        presenter.deleteGroup(0);

        // should have 1 group only
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([viewModelGroup]);

        // let's delete the remaining group
        presenter.deleteGroup(0);

        // should still have 1 default group
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([defaultGroup]);
    });

    it("should be able to add and delete filters from a group", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        presenter.addNewFilterToGroup(0);

        // should have 2 filters inside the only existing group
        expect(viewModel.queryObject.groups[0].filters.length).toBe(2);
        expect(viewModel.queryObject.groups[0].filters).toEqual([testFilter, testFilter]);

        const resultFilter = viewModel.queryObject.groups[0].filters[1];

        // let's delete the first filter
        presenter.deleteFilterFromGroup(0, 0);

        // should have 1 group only
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups[0].filters).toEqual([resultFilter]);

        // let's delete the remaining filter
        presenter.deleteFilterFromGroup(0, 0);

        // should still have 1 default filter
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups[0].filters).toEqual([defaultFilter]);
    });

    it("should be able to set the queryObject", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        {
            // should be able to set the `queryObject` operation
            presenter.setQueryObject({
                ...viewModel.queryObject,
                operation: Operation.OR
            });

            expect(viewModel.queryObject.operation).toEqual(Operation.OR);
        }

        {
            // should be able to set the `queryObject` group
            presenter.setQueryObject({
                ...viewModel.queryObject,
                groups: [
                    {
                        ...viewModel.queryObject.groups[0],
                        operation: Operation.OR
                    }
                ]
            });

            expect(viewModel.queryObject.groups[0].operation).toEqual(Operation.OR);
        }

        {
            // should be able to change the `queryObject` filter definition
            presenter.setQueryObject({
                ...viewModel.queryObject,
                groups: [
                    {
                        ...viewModel.queryObject.groups[0],
                        filters: [
                            {
                                ...testFilter,
                                field: "any-field"
                            }
                        ]
                    }
                ]
            });

            expect(viewModel.queryObject.groups[0].filters[0].field).toEqual("any-field");
        }
    });

    it("should perform validation and call provided callbacks `onSubmit`", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setQueryObject({
            ...viewModel.queryObject,
            groups: [
                {
                    ...viewModel.queryObject.groups[0],
                    filters: [
                        {
                            field: "any-field",
                            condition: "any-condition",
                            value: "" // empty value -> this should trigger the error
                        }
                    ]
                }
            ]
        });

        presenter.onSubmit(viewModel.queryObject, onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(viewModel.invalidFields).length).toBe(1);

        presenter.setQueryObject({
            ...viewModel.queryObject,
            groups: [
                {
                    ...viewModel.queryObject.groups[0],
                    filters: [
                        {
                            field: "any-field",
                            condition: "any-condition",
                            value: "any-value"
                        }
                    ]
                }
            ]
        });

        presenter.onSubmit(viewModel.queryObject, onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(viewModel.invalidFields).toEqual({});
    });

    it("should able to empty a filter from a group", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // Let's change the queryObject and change the only exising filter
        presenter.setQueryObject({
            ...viewModel.queryObject,
            groups: [
                {
                    ...viewModel.queryObject.groups[0],
                    filters: [
                        {
                            ...testFilter,
                            field: "any-field"
                        }
                    ]
                }
            ]
        });

        // let's empty the filter
        presenter.emptyFilterIntoGroup(0, 0);

        // should have a filter with default definition
        expect(viewModel.queryObject.groups[0].filters).toEqual([defaultFilter]);
    });
});

describe("FieldDTO definition", () => {
    const modelId = "modelId-id";
    const fields: [FieldRaw, FieldDTO][] = [
        [
            {
                id: `${FieldType.TEXT}-field`,
                label: `${FieldType.TEXT} field`,
                type: FieldType.TEXT
            },

            {
                label: `${FieldType.TEXT} field`,
                value: `${FieldType.TEXT}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "contains", value: "_contains" },
                    { label: "starts with", value: "_startsWith" },
                    { label: "is not equal to", value: "_not" },
                    { label: "doesn't contain", value: "_not_contains" },
                    { label: "doesn't start with", value: "_not_startsWith" }
                ],
                predefined: [],
                type: FieldType.TEXT
            }
        ],
        [
            {
                id: "long-text-field",
                label: "long-text field",
                type: "long-text"
            },
            {
                label: "long-text field",
                value: "long-text-field",
                conditions: [
                    { label: "contains", value: "_contains" },
                    { label: "doesn't contain", value: "_not_contains" }
                ],
                predefined: [],
                type: FieldType.TEXT
            }
        ],
        [
            {
                id: `${FieldType.BOOLEAN}-field`,
                label: `${FieldType.BOOLEAN} field`,
                type: FieldType.BOOLEAN
            },
            {
                label: `${FieldType.BOOLEAN} field`,
                value: `${FieldType.BOOLEAN}-field`,
                conditions: [
                    { label: "is", value: " " },
                    { label: "is not", value: "_not" }
                ],
                predefined: [],
                type: FieldType.BOOLEAN
            }
        ],
        [
            {
                id: `${FieldType.DATE}-field`,
                label: `${FieldType.DATE} field`,
                type: "datetime",
                settings: {
                    type: FieldType.DATE
                }
            },
            {
                label: `${FieldType.DATE} field`,
                value: `${FieldType.DATE}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: FieldType.DATE
            }
        ],
        [
            {
                id: `${FieldType.TIME}-field`,
                label: `${FieldType.TIME} field`,
                type: "datetime",
                settings: {
                    type: FieldType.TIME
                }
            },
            {
                label: `${FieldType.TIME} field`,
                value: `${FieldType.TIME}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: FieldType.TIME
            }
        ],
        [
            {
                id: `${FieldType.DATETIME_WITH_TIMEZONE}-field`,
                label: `${FieldType.DATETIME_WITH_TIMEZONE} field`,
                type: "datetime",
                settings: {
                    type: FieldType.DATETIME_WITH_TIMEZONE
                }
            },
            {
                label: `${FieldType.DATETIME_WITH_TIMEZONE} field`,
                value: `${FieldType.DATETIME_WITH_TIMEZONE}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: FieldType.DATETIME_WITH_TIMEZONE
            }
        ],
        [
            {
                id: `${FieldType.DATETIME_WITHOUT_TIMEZONE}-field`,
                label: `${FieldType.DATETIME_WITHOUT_TIMEZONE} field`,
                type: "datetime",
                settings: {
                    type: FieldType.DATETIME_WITHOUT_TIMEZONE
                }
            },
            {
                label: `${FieldType.DATETIME_WITHOUT_TIMEZONE} field`,
                value: `${FieldType.DATETIME_WITHOUT_TIMEZONE}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: FieldType.DATETIME_WITHOUT_TIMEZONE
            }
        ],
        [
            {
                id: `${FieldType.MULTIPLE_VALUES}-field`,
                label: `${FieldType.MULTIPLE_VALUES} field`,
                type: "text",
                multipleValues: true,
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            value: "value-1",
                            label: "value 1"
                        }
                    ]
                }
            },
            {
                label: `${FieldType.MULTIPLE_VALUES} field`,
                value: `${FieldType.MULTIPLE_VALUES}-field`,
                conditions: [
                    { label: "contains", value: "_in" },
                    { label: "doesn't contain", value: "_not_in" }
                ],
                predefined: [
                    {
                        value: "value-1",
                        label: "value 1"
                    }
                ],
                type: FieldType.MULTIPLE_VALUES
            }
        ],
        [
            {
                id: `${FieldType.NUMBER}-field`,
                label: `${FieldType.NUMBER} field`,
                type: FieldType.NUMBER
            },
            {
                label: `${FieldType.NUMBER} field`,
                value: `${FieldType.NUMBER}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is less than", value: "_lt" },
                    { label: "is less or equal to", value: "_lte" },
                    { label: "is greater than", value: "_gt" },
                    { label: "is greater or equal to", value: "_gte" }
                ],
                predefined: [],
                type: FieldType.NUMBER
            }
        ],
        [
            {
                id: "any-field",
                label: "any field",
                type: "any"
            },
            {
                label: "any field",
                value: "any-field",
                conditions: [],
                predefined: [],
                type: FieldType.TEXT
            }
        ]
    ];

    fields.forEach(([fieldRaw, fieldDTO]) => {
        let viewModel: QueryBuilderViewModel;

        beforeEach(() => {
            const presenter = new QueryBuilderPresenter(modelId, [fieldRaw]);
            presenter.load(generatedViewModel => {
                viewModel = generatedViewModel;
            });
        });

        it(`should transform "Raw ${fieldRaw.label}" -> "DTO ${fieldDTO.label}"`, () => {
            expect(viewModel.fields).toEqual([fieldDTO]);
        });
    });
});
