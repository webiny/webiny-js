import {
    FilterDTO,
    FilterGroupDTO,
    FilterGroupFilterDTO,
    Operation
} from "~/components/AdvancedSearch/domain";
import { QuerySaverDialogPresenter } from "./QuerySaverDialogPresenter";

describe("QuerySaverDialogPresenter", () => {
    const demoFilter: FilterGroupFilterDTO = {
        field: "any-field",
        value: "any-value",
        condition: "any-condition"
    };
    const demoGroup: FilterGroupDTO = {
        operation: Operation.AND,
        filters: [demoFilter]
    };

    const filter: FilterDTO = {
        id: "",
        name: "QueryObject name",
        description: "QueryObject description",
        operation: Operation.AND,
        groups: [demoGroup]
    };

    let presenter: QuerySaverDialogPresenter;

    beforeEach(() => {
        presenter = new QuerySaverDialogPresenter();
    });

    it("should create QuerySaverDialogPresenter with `vm` definition", () => {
        // let's load a filter
        presenter.load(filter);

        // `vm` should have the expected `data` definition
        expect(presenter.vm.data).toEqual({
            name: filter.name,
            description: filter.description
        });

        // `vm` should have the expected `invalidFields` definition
        expect(presenter.vm.invalidFields).toEqual({});
    });

    it("should be able to set data back to the filter", () => {
        // let's load a filter
        presenter.load(filter);

        // should be able to set the `queryObject` name and description
        presenter.setFilter({
            name: "Any other name",
            description: "Any other description"
        });

        expect(presenter.vm.data.name).toEqual("Any other name");
        expect(presenter.vm.data.description).toEqual("Any other description");
    });

    it("should perform validation and call provided callbacks `onSubmit`", () => {
        // let's load a filter
        presenter.load(filter);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setFilter({
            name: "", // empty value -> this should trigger the error
            description: ""
        });

        presenter.onSave(onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(presenter.vm.invalidFields).length).toBe(1);

        // let's change back `name` value so the validation will pass
        presenter.setFilter({
            name: "Any name",
            description: ""
        });

        presenter.onSave(onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(presenter.vm.invalidFields).toEqual({});
    });
});
