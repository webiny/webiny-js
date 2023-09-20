import {
    QueryBuilderPresenter,
    QueryBuilderViewModel
} from "~/components/AdvancedSearch/QueryBuilder/adapters";
import { FieldRaw, Operation } from "~/components/AdvancedSearch/QueryBuilder/domain";

describe("QueryBuilderPresenter", () => {
    const fieldId = "test-field";
    const fieldLabel = "Test Field";
    const fieldType = "text";

    const defaultFilter = {
        field: "",
        condition: "",
        value: ""
    };

    const defaultGroup = {
        operation: Operation.AND,
        filters: [defaultFilter]
    };

    let viewModel: QueryBuilderViewModel;

    beforeEach(() => {
        const defaultFields: FieldRaw[] = [
            {
                id: fieldId,
                label: fieldLabel,
                type: fieldType
            }
        ];

        const presenter = new QueryBuilderPresenter(defaultFields);
        viewModel = presenter.getViewModel();
    });

    it("should create QueryBuilderPresenter with `viewModel` definition", () => {
        // `viewModel` should have the expected `fields` definition
        expect(viewModel.fields).toEqual([
            {
                label: fieldLabel,
                value: fieldId,
                type: {
                    value: fieldType
                },
                predefined: expect.any(Array),
                conditions: expect.any(Array)
            }
        ]);

        // `viewModel` should have the expected `queryObject` definition
        expect(viewModel.queryObject).toEqual({
            id: expect.any(String),
            name: "Untitled",
            operation: "AND",
            groups: [defaultGroup]
        });

        // `viewModel` should have the expected `invalidFields` definition
        expect(viewModel.invalidFields).toEqual({});
    });

    it("should be able to add and delete groups", () => {
        // should only have 1 group, created by default
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([defaultGroup]);

        viewModel.addGroup();

        // should have 2 groups
        expect(viewModel.queryObject.groups.length).toBe(2);
        expect(viewModel.queryObject.groups).toEqual([defaultGroup, defaultGroup]);

        const testGroup = viewModel.queryObject.groups[1];

        // let's delete the first group
        viewModel.deleteGroup(0);

        // should have 1 group only
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups).toEqual([testGroup]);
    });

    it("should be able to add and delete filters from a group", () => {
        viewModel.addNewFilterToGroup(0);

        // should have 2 filters inside the only existing group
        expect(viewModel.queryObject.groups[0].filters.length).toBe(2);
        expect(viewModel.queryObject.groups[0].filters).toEqual([defaultFilter, defaultFilter]);

        const testFilter = viewModel.queryObject.groups[0].filters[1];

        // let's delete the first filter
        viewModel.deleteFilterFromGroup(0, 0);

        // should have 1 group only
        expect(viewModel.queryObject.groups.length).toBe(1);
        expect(viewModel.queryObject.groups[0].filters).toEqual([testFilter]);
    });

    it("should be able to set the queryObject", () => {
        // should be able to set the `queryObject` operation
        viewModel.setQueryObject({
            ...viewModel.queryObject,
            operation: Operation.OR
        });

        expect(viewModel.queryObject.operation).toEqual(Operation.OR);

        // should be able to set the `group` operation
        viewModel.setQueryObject({
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
        viewModel.setQueryObject({
            ...viewModel.queryObject,
            groups: [
                {
                    ...viewModel.queryObject.groups[0],
                    filters: [
                        {
                            ...defaultFilter,
                            field: "any-field"
                        }
                    ]
                }
            ]
        });

        expect(viewModel.queryObject.groups[0].filters[0].field).toEqual("any-field");
    });

    it("should work perform validation and call provided callbacks `onSubmit`", () => {
        const onSuccess = jest.fn();
        const onError = jest.fn();

        viewModel.setQueryObject({
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

        viewModel.onSubmit(viewModel.queryObject, onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(viewModel.invalidFields).length).toBe(1);

        viewModel.setQueryObject({
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

        viewModel.onSubmit(viewModel.queryObject, onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(viewModel.invalidFields).toEqual({});
    });
});
