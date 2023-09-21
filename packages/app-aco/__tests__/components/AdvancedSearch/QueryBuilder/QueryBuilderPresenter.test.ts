import {
    QueryBuilderPresenter,
    QueryBuilderViewModel
} from "~/components/AdvancedSearch/QueryBuilder/adapters";
import {
    FieldDTO,
    FieldRaw,
    Operation,
    TypeDTO
} from "~/components/AdvancedSearch/QueryBuilder/domain";

describe("QueryBuilderPresenter", () => {
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

    const testFolder = {
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

        presenter = new QueryBuilderPresenter(defaultFields);
        viewModel = presenter.getViewModel();
    });

    it("should create QueryBuilderPresenter with `viewModel` definition", () => {
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
            operation: "AND",
            groups: [testFolder]
        });

        // `viewModel` should have the expected `invalidFields` definition
        expect(viewModel.invalidFields).toEqual({});
    });

    it("should be able to add and delete groups", () => {
        // should only have 1 group, created by default
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([testFolder]);

        presenter.addGroup();

        // should have 2 groups
        expect(viewModel.queryObject.groups.length).toBe(2);
        expect(viewModel.queryObject.groups).toEqual([testFolder, testFolder]);

        const testGroup = viewModel.queryObject.groups[1];

        // let's delete the first group
        presenter.deleteGroup(0);

        // should have 1 group only
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([testGroup]);

        // let's delete the remaining group
        presenter.deleteGroup(0);

        // should still have 1 default group
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([defaultGroup]);
    });

    it("should be able to add and delete filters from a group", () => {
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
        // should be able to set the `queryObject` operation
        presenter.setQueryObject({
            ...viewModel.queryObject,
            operation: Operation.OR
        });

        expect(viewModel.queryObject.operation).toEqual(Operation.OR);

        // should be able to set the `group` operation
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

        // should be able to change the filter definition
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
    });

    it("should perform validation and call provided callbacks `onSubmit`", () => {
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
    const fields: [FieldRaw, FieldDTO][] = [
        [
            {
                id: `${TypeDTO.TEXT}-field`,
                label: `${TypeDTO.TEXT} field`,
                type: TypeDTO.TEXT
            },

            {
                label: `${TypeDTO.TEXT} field`,
                value: `${TypeDTO.TEXT}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "contains", value: "_contains" },
                    { label: "starts with", value: "_startsWith" },
                    { label: "is not equal to", value: "_not" },
                    { label: "doesn't contain", value: "_not_contains" },
                    { label: "doesn't start with", value: "_not_startsWith" }
                ],
                predefined: [],
                type: TypeDTO.TEXT
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
                type: TypeDTO.TEXT
            }
        ],
        [
            {
                id: `${TypeDTO.BOOLEAN}-field`,
                label: `${TypeDTO.BOOLEAN} field`,
                type: TypeDTO.BOOLEAN
            },
            {
                label: `${TypeDTO.BOOLEAN} field`,
                value: `${TypeDTO.BOOLEAN}-field`,
                conditions: [
                    { label: "is", value: " " },
                    { label: "is not", value: "_not" }
                ],
                predefined: [],
                type: TypeDTO.BOOLEAN
            }
        ],
        [
            {
                id: `${TypeDTO.DATE}-field`,
                label: `${TypeDTO.DATE} field`,
                type: "datetime",
                settings: {
                    type: TypeDTO.DATE
                }
            },
            {
                label: `${TypeDTO.DATE} field`,
                value: `${TypeDTO.DATE}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: TypeDTO.DATE
            }
        ],
        [
            {
                id: `${TypeDTO.TIME}-field`,
                label: `${TypeDTO.TIME} field`,
                type: "datetime",
                settings: {
                    type: TypeDTO.TIME
                }
            },
            {
                label: `${TypeDTO.TIME} field`,
                value: `${TypeDTO.TIME}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: TypeDTO.TIME
            }
        ],
        [
            {
                id: `${TypeDTO.DATETIME_WITH_TIMEZONE}-field`,
                label: `${TypeDTO.DATETIME_WITH_TIMEZONE} field`,
                type: "datetime",
                settings: {
                    type: TypeDTO.DATETIME_WITH_TIMEZONE
                }
            },
            {
                label: `${TypeDTO.DATETIME_WITH_TIMEZONE} field`,
                value: `${TypeDTO.DATETIME_WITH_TIMEZONE}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: TypeDTO.DATETIME_WITH_TIMEZONE
            }
        ],
        [
            {
                id: `${TypeDTO.DATETIME_WITHOUT_TIMEZONE}-field`,
                label: `${TypeDTO.DATETIME_WITHOUT_TIMEZONE} field`,
                type: "datetime",
                settings: {
                    type: TypeDTO.DATETIME_WITHOUT_TIMEZONE
                }
            },
            {
                label: `${TypeDTO.DATETIME_WITHOUT_TIMEZONE} field`,
                value: `${TypeDTO.DATETIME_WITHOUT_TIMEZONE}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is before", value: "_lt" },
                    { label: "is before or equal to", value: "_lte" },
                    { label: "is after", value: "_gt" },
                    { label: "is after or equal to", value: "_gte" }
                ],
                predefined: [],
                type: TypeDTO.DATETIME_WITHOUT_TIMEZONE
            }
        ],
        [
            {
                id: `${TypeDTO.MULTIPLE_VALUES}-field`,
                label: `${TypeDTO.MULTIPLE_VALUES} field`,
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
                label: `${TypeDTO.MULTIPLE_VALUES} field`,
                value: `${TypeDTO.MULTIPLE_VALUES}-field`,
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
                type: TypeDTO.MULTIPLE_VALUES
            }
        ],
        [
            {
                id: `${TypeDTO.NUMBER}-field`,
                label: `${TypeDTO.NUMBER} field`,
                type: TypeDTO.NUMBER
            },
            {
                label: `${TypeDTO.NUMBER} field`,
                value: `${TypeDTO.NUMBER}-field`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" },
                    { label: "is less than", value: "_lt" },
                    { label: "is less or equal to", value: "_lte" },
                    { label: "is greater than", value: "_gt" },
                    { label: "is greater or equal to", value: "_gte" }
                ],
                predefined: [],
                type: TypeDTO.NUMBER
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
                type: TypeDTO.TEXT
            }
        ]
    ];

    fields.forEach(([fieldRaw, fieldDTO]) => {
        it(`should transform "Raw ${fieldRaw.label}" -> "DTO ${fieldDTO.label}" `, () => {
            const presenter = new QueryBuilderPresenter([fieldRaw]);
            const viewModel = presenter.getViewModel();

            expect(viewModel.fields).toEqual([fieldDTO]);
        });
    });
});
