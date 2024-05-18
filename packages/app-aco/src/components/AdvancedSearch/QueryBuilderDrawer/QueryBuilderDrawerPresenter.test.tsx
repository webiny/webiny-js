import { QueryBuilderDrawerPresenter } from "./QueryBuilderDrawerPresenter";
import { FilterDTO, Operation } from "~/components/AdvancedSearch/domain";

describe("QueryBuilderDrawerPresenter", () => {
    const defaultFilter = { field: "", value: "", condition: "" };

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
        presenter = new QueryBuilderDrawerPresenter();
    });

    it("should create QueryBuilderDrawerPresenter with `vm` definition", () => {
        presenter.load(filter);

        // `vm` should have the expected `name` and `description` definition
        expect(presenter.vm.name).toEqual(filter.name);
        expect(presenter.vm.description).toEqual(filter.description);

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
