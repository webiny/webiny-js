import {
    FilterDTO,
    GroupDTO,
    Operation,
    QueryObjectDTO
} from "~/components/AdvancedSearch/QueryObject";
import { QuerySaverDialogPresenter } from "./QuerySaverDialogPresenter";

describe("QuerySaverDialogPresenter", () => {
    const modelId = "model-id";

    const demoFilter: FilterDTO = {
        field: "any-field",
        value: "any-value",
        condition: "any-condition"
    };
    const demoGroup: GroupDTO = {
        operation: Operation.AND,
        filters: [demoFilter]
    };

    const queryObject: QueryObjectDTO = {
        id: "",
        name: "QueryObject name",
        description: "QueryObject description",
        modelId,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    let presenter: QuerySaverDialogPresenter;

    beforeEach(() => {
        presenter = new QuerySaverDialogPresenter(queryObject);
    });

    it("should create QuerySaverDialogPresenter with `vm` definition", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        // `vm` should have the expected `data` definition
        expect(presenter.vm.data).toEqual({
            name: queryObject.name,
            description: queryObject.description
        });

        // `vm` should have the expected `invalidFields` definition
        expect(presenter.vm.invalidFields).toEqual({});
    });

    it("should be able to set data back to the queryObject", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        // should be able to set the `queryObject` name and description
        presenter.setQueryObject({
            name: "Any other name",
            description: "Any other description"
        });

        expect(presenter.vm.data.name).toEqual("Any other name");
        expect(presenter.vm.data.description).toEqual("Any other description");
    });

    it("should perform validation and call provided callbacks `onSubmit`", () => {
        // let's load a queryObjectDTO
        presenter.load(queryObject);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setQueryObject({
            name: "", // empty value -> this should trigger the error
            description: ""
        });

        presenter.onSubmit(onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(presenter.vm.invalidFields).length).toBe(1);

        // let's change back `name` value so the validation will pass
        presenter.setQueryObject({
            name: "Any name",
            description: ""
        });

        presenter.onSubmit(onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(presenter.vm.invalidFields).toEqual({});
    });
});
