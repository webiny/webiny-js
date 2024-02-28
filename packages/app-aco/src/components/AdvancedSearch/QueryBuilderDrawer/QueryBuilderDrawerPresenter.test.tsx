import React from "react";
import { QueryBuilderDrawerPresenter } from "./QueryBuilderDrawerPresenter";
import {
    FieldDTO,
    FieldRaw,
    FieldType,
    FilterDTO,
    Operation
} from "~/components/AdvancedSearch/domain";
import { FieldRendererConfig } from "~/config/advanced-search/FieldRenderer";

describe("QueryBuilderDrawerPresenter", () => {
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

    const filter: FilterDTO = {
        id: "",
        name: "Filter name",
        description: "Filter description",
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

        const fieldConfigs: FieldRendererConfig[] = [
            {
                types: [FieldType.TEXT],
                name: "demo",
                element: <>{"Any element"}</>
            }
        ];

        presenter = new QueryBuilderDrawerPresenter(defaultFields, fieldConfigs);
    });

    it("should create QueryBuilderDrawerPresenter with `vm` definition", () => {
        presenter.load(filter);

        // `vm` should have the expected `name` and `description` definition
        expect(presenter.vm.name).toEqual(filter.name);
        expect(presenter.vm.description).toEqual(filter.description);

        // `vm` should have the expected `fields` definition
        expect(presenter.vm.fields).toEqual([
            {
                label: fieldLabel,
                value: fieldId,
                type: fieldType,
                predefined: expect.any(Array),
                conditions: expect.any(Array),
                settings: {
                    modelIds: []
                }
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
                    canDelete: false,
                    filters: [
                        {
                            ...testFilter,
                            canDelete: false
                        }
                    ]
                }
            ]
        });

        // `vm` should have the expected `invalidFields` and `invalidMessage` definition
        expect(presenter.vm.invalidFields).toEqual({});
        expect(presenter.vm.invalidMessage).toEqual("");
    });

    it("should be able to add and delete groups", () => {
        // let's load a filter
        presenter.load(filter);

        // should only have 1 group, created by default
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups).toEqual([
            {
                title: "Filter group #1",
                open: true,
                operation: Operation.AND,
                canDelete: false,
                filters: [
                    {
                        ...testFilter,
                        canDelete: false
                    }
                ]
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
                canDelete: false,
                filters: [
                    {
                        ...testFilter,
                        canDelete: false
                    }
                ]
            },
            {
                title: "Filter group #2",
                open: true,
                operation: Operation.AND,
                canDelete: true,
                filters: [
                    {
                        ...testFilter,
                        canDelete: false
                    }
                ]
            }
        ]);

        // let's delete the first group
        presenter.deleteGroup(1);

        // should have 1 group only
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups).toEqual([
            {
                title: "Filter group #1",
                open: true,
                operation: Operation.AND,
                canDelete: false,
                filters: [
                    {
                        ...testFilter,
                        canDelete: false
                    }
                ]
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
                canDelete: false,
                filters: [
                    {
                        ...testFilter,
                        canDelete: false
                    }
                ]
            }
        ]);
    });

    it("should be able to add and delete filters from a group", () => {
        // let's load a filter
        presenter.load(filter);

        // let's load a new filter to the first group
        presenter.addNewFilterToGroup(0);

        // should have 2 filters inside the only existing group
        expect(presenter.vm.data.groups[0].filters.length).toBe(2);
        expect(presenter.vm.data.groups[0].filters).toEqual([
            {
                ...testFilter,
                canDelete: false
            },
            {
                ...testFilter,
                canDelete: true
            }
        ]);

        const resultFilter = presenter.vm.data.groups[0].filters[0];

        // let's delete the second filter
        presenter.deleteFilterFromGroup(0, 1);

        // should have 1 group only
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups[0].filters).toEqual([resultFilter]);

        // let's delete the remaining filter
        presenter.deleteFilterFromGroup(0, 0);

        // should still have 1 default filter
        expect(presenter.vm.data.groups.length).toBe(1);
        expect(presenter.vm.data.groups[0].filters).toEqual([
            {
                ...defaultFilter,
                canDelete: false
            }
        ]);
    });

    it("should be able to set data back to the filter", () => {
        // let's load a filter
        presenter.load(filter);

        {
            // should be able to set the `data` operation
            presenter.setFilter({
                operation: Operation.OR,
                groups: [
                    {
                        title: "Filter group #1",
                        open: true,
                        operation: Operation.AND,
                        canDelete: false,
                        filters: [
                            {
                                ...testFilter,
                                canDelete: false
                            }
                        ]
                    }
                ]
            });

            expect(presenter.vm.data.operation).toEqual(Operation.OR);
        }

        {
            // should be able to set the `data` group
            presenter.setFilter({
                operation: Operation.OR,
                groups: [
                    {
                        title: "Filter group #1",
                        open: true,
                        operation: Operation.OR,
                        canDelete: false,
                        filters: [
                            {
                                ...testFilter,
                                canDelete: false
                            }
                        ]
                    }
                ]
            });

            expect(presenter.vm.data.groups[0].operation).toEqual(Operation.OR);
        }

        {
            // should be able to change the `data` filter definition
            presenter.setFilter({
                operation: Operation.OR,
                groups: [
                    {
                        title: "Filter group #1",
                        open: true,
                        operation: Operation.OR,
                        canDelete: false,
                        filters: [
                            {
                                ...testFilter,
                                canDelete: false,
                                field: "any-field"
                            }
                        ]
                    }
                ]
            });

            expect(presenter.vm.data.groups[0].filters[0].field).toEqual("any-field");
        }
    });

    it("should perform validation and call provided callbacks `onApply`", () => {
        // let's load a filter
        presenter.load(filter);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setFilter({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
                    canDelete: false,
                    filters: [
                        {
                            canDelete: false,
                            field: "any-field",
                            condition: "any-condition",
                            value: "" // empty value -> this should trigger the error
                        }
                    ]
                }
            ]
        });

        presenter.onApply(onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(presenter.vm.invalidFields).length).toBe(1);
        expect(presenter.vm.invalidMessage.length).toBeGreaterThanOrEqual(1);

        presenter.setFilter({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
                    canDelete: false,
                    filters: [
                        {
                            field: "any-field",
                            condition: "any-condition",
                            value: "any-value",
                            canDelete: false
                        }
                    ]
                }
            ]
        });

        presenter.onApply(onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(presenter.vm.invalidFields).toEqual({});
        expect(presenter.vm.invalidMessage.length).toBe(0);
    });

    it("should perform validation and call provided callbacks `onSave`", () => {
        // let's load a filter
        presenter.load(filter);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setFilter({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
                    canDelete: false,
                    filters: [
                        {
                            canDelete: false,
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

        presenter.setFilter({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.OR,
                    canDelete: false,
                    filters: [
                        {
                            canDelete: false,
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
        // let's load a filter
        presenter.load(filter);

        // Let's change the filter and change the only exising filter
        presenter.setFilter({
            operation: Operation.OR,
            groups: [
                {
                    title: "Filter group #1",
                    open: true,
                    operation: Operation.AND,
                    canDelete: false,
                    filters: [
                        {
                            field: "any-field",
                            condition: "any-condition",
                            value: "any-value",
                            canDelete: false
                        }
                    ]
                }
            ]
        });

        // let's empty the filter
        presenter.setFilterFieldData(0, 0, "new-field");

        // should have a filter with default definition and new field value
        expect(presenter.vm.data.groups[0].filters).toEqual([
            { ...defaultFilter, field: "new-field", canDelete: false }
        ]);
    });
});

describe("FieldDTO definition", () => {
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
                type: FieldType.TEXT,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.TEXT,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.BOOLEAN,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.DATE,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.TIME,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.DATETIME_WITH_TIMEZONE,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.DATETIME_WITHOUT_TIMEZONE,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.MULTIPLE_VALUES,
                settings: {
                    modelIds: []
                }
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
                type: FieldType.NUMBER,
                settings: {
                    modelIds: []
                }
            }
        ],
        [
            {
                id: `${FieldType.REF}-field`,
                label: `${FieldType.REF} field`,
                type: FieldType.REF,
                settings: {
                    models: [
                        {
                            modelId: "modelId-1"
                        },
                        {
                            modelId: "modelId-2"
                        },
                        {
                            modelId: "modelId-3"
                        }
                    ]
                }
            },
            {
                label: `${FieldType.REF} field`,
                value: `${FieldType.REF}-field.entryId`,
                conditions: [
                    { label: "is equal to", value: " " },
                    { label: "is not equal to", value: "_not" }
                ],
                predefined: [],
                type: FieldType.REF,
                settings: {
                    modelIds: ["modelId-1", "modelId-2", "modelId-3"]
                }
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
                type: FieldType.TEXT,
                settings: {
                    modelIds: []
                }
            }
        ]
    ];

    const configs: FieldRendererConfig[] = [
        {
            types: [FieldType.TEXT],
            name: "demo",
            element: <>{"Any element"}</>
        }
    ];

    fields.forEach(([fieldRaw, fieldDTO]) => {
        let presenter: QueryBuilderDrawerPresenter;

        beforeEach(() => {
            presenter = new QueryBuilderDrawerPresenter([fieldRaw], configs);
        });

        it(`should transform "Raw ${fieldRaw.label}" -> "DTO ${fieldDTO.label}"`, () => {
            expect(presenter.vm.fields).toEqual([fieldDTO]);
        });
    });
});
