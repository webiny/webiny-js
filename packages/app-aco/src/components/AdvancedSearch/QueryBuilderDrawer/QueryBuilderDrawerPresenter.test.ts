import { QueryBuilderDrawerPresenter } from "./QueryBuilderDrawerPresenter";
import {
    FieldDTO,
    FieldRaw,
    FieldType,
    Operation,
    QueryObjectDTO
} from "~/components/AdvancedSearch/QueryObject";

describe("QueryBuilderDrawerPresenter", () => {
    const modelId = "model-id";
    const defaultFilter = { field: "", value: "", condition: "" };

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

    const queryObject: QueryObjectDTO = {
        id: "",
        name: "QueryObject name",
        description: "QueryObject description",
        modelId,
        operation: Operation.AND,
        groups: [testGroup]
    };

    let presenter: QueryBuilderDrawerPresenter;

    beforeEach(() => {
        const defaultFields: FieldRaw[] = [
            {
                id: fieldId,
                label: fieldLabel,
                type: fieldType
            }
        ];

        presenter = new QueryBuilderDrawerPresenter(queryObject, defaultFields);
    });

    it("should create QueryBuilderDrawerPresenter with `vm` definition", () => {
        presenter.load(queryObject);

        // `vm` should have the expected `name` and `description` definition
        expect(presenter.vm.name).toEqual(queryObject.name);
        expect(presenter.vm.description).toEqual(queryObject.description);

        // `vm` should have the expected `fields` definition
        expect(presenter.vm.fields).toEqual([
            {
                label: fieldLabel,
                value: fieldId,
                type: fieldType,
                predefined: expect.any(Array),
                conditions: expect.any(Array)
            }
        ]);

        // `vm` should have the expected `data` definition
        expect(presenter.vm.data).toEqual({
            operation: "AND",
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.AND,
                    filters: [testFilter]
                }
            ]
        });

        // `vm` should have the expected `invalidFields` and `invalidMessage` definition
        expect(presenter.vm.invalidFields).toEqual({});
        expect(presenter.vm.invalidMessage).toEqual("");
    });

    it("should be able to add and delete groups", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        // should only have 1 group, created by default
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups).toEqual([
            {
                title: "Filter group #1",
                open: true,
                operation: Operation.AND,
                filters: [testFilter]
            }
        ]);

        presenter.addGroup();

        // should have 2 groups
        expect(presenter.vm.data.groups.length).toBe(2);
        expect(presenter.vm.data.groups).toEqual([
            {
                title: "Filter group #1",
                open: true,
                operation: Operation.AND,
                filters: [testFilter]
            },
            {
                title: "Filter group #2",
                open: true,
                operation: Operation.AND,
                filters: [testFilter]
            }
        ]);

        // let's delete the first group
        presenter.deleteGroup(0);

        // should have 1 group only
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups).toEqual([
            {
                title: "Filter group #1",
                open: true,
                operation: Operation.AND,
                filters: [testFilter]
            }
        ]);

        // let's delete the remaining group
        presenter.deleteGroup(0);

        // should still have 1 default group
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups).toEqual([
            {
                title: "Filter group #1",
                open: true,
                operation: Operation.AND,
                filters: [testFilter]
            }
        ]);
    });

    it("should be able to add and delete filters from a group", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        // let's load a new filter to the first group
        presenter.addNewFilterToGroup(0);

        // should have 2 filters inside the only existing group
        expect(presenter.vm.data.groups[0].filters.length).toBe(2);
        expect(presenter.vm.data.groups[0].filters).toEqual([testFilter, testFilter]);

        const resultFilter = presenter.vm.data.groups[0].filters[1];

        // let's delete the first filter
        presenter.deleteFilterFromGroup(0, 0);

        // should have 1 group only
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups[0].filters).toEqual([resultFilter]);

        // let's delete the remaining filter
        presenter.deleteFilterFromGroup(0, 0);

        // should still have 1 default filter
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups[0].filters).toEqual([defaultFilter]);
    });

    it("should be able to set data back to the queryObject", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        {
            // should be able to set the `data` operation
            presenter.setQueryObject({
                operation: Operation.OR,
                groups: [
                    {
                        title: "Filter group #1",
                        open: true,
                        operation: Operation.AND,
                        filters: [testFilter]
                    }
                ]
            });

            expect(presenter.vm.data.operation).toEqual(Operation.OR);
        }

        {
            // should be able to set the `data` group
            presenter.setQueryObject({
                operation: Operation.OR,
                groups: [
                    {
                        title: "Filter group #1",
                        open: true,
                        operation: Operation.OR,
                        filters: [testFilter]
                    }
                ]
            });

            expect(presenter.vm.data.groups[0].operation).toEqual(Operation.OR);
        }

        {
            // should be able to change the `data` filter definition
            presenter.setQueryObject({
                operation: Operation.OR,
                groups: [
                    {
                        title: "Filter group #1",
                        open: true,
                        operation: Operation.OR,
                        filters: [
                            {
                                ...testFilter,
                                field: "any-field"
                            }
                        ]
                    }
                ]
            });

            expect(presenter.vm.data.groups[0].filters[0].field).toEqual("any-field");
        }
    });

    it("should perform validation and call provided callbacks `onSubmit`", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setQueryObject({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
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

        presenter.onSubmit(onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(presenter.vm.invalidFields).length).toBe(1);
        expect(presenter.vm.invalidMessage.length).toBeGreaterThanOrEqual(1);

        presenter.setQueryObject({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
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

        presenter.onSubmit(onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(presenter.vm.invalidFields).toEqual({});
        expect(presenter.vm.invalidMessage.length).toBe(0);
    });

    it("should perform validation and call provided callbacks `onSave`", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setQueryObject({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
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

        presenter.onSave(onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(presenter.vm.invalidFields).length).toBe(1);
        expect(presenter.vm.invalidMessage.length).toBeGreaterThanOrEqual(1);

        presenter.setQueryObject({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
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

        presenter.onSave(onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(presenter.vm.invalidFields).toEqual({});
        expect(presenter.vm.invalidMessage.length).toBe(0);
    });

    it("should able to set the filter `field` data", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        // Let's change the queryObject and change the only exising filter
        presenter.setQueryObject({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.AND,
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

        // let's empty the filter
        presenter.setFilterFieldData(0, 0, "new-field");

        // should have a filter with default definition and new field value
        expect(presenter.vm.data.groups[0].filters).toEqual([
            { ...defaultFilter, field: "new-field" }
        ]);
    });
});

describe("FieldDTO definition", () => {
    const testFilter = {
        field: "",
        condition: "",
        value: ""
    };

    const testGroup = {
        operation: Operation.AND,
        filters: [testFilter]
    };

    const queryObject: QueryObjectDTO = {
        id: "",
        name: "QueryObject name",
        description: "QueryObject description",
        modelId: "modelId",
        operation: Operation.AND,
        groups: [testGroup]
    };

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
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" }
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
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" }
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
        let presenter: QueryBuilderDrawerPresenter;

        beforeEach(() => {
            presenter = new QueryBuilderDrawerPresenter(queryObject, [fieldRaw]);
        });

        it(`should transform "Raw ${fieldRaw.label}" -> "DTO ${fieldDTO.label}"`, () => {
            expect(presenter.vm.fields).toEqual([fieldDTO]);
        });
    });
});
