import {
    FilterDTO,
    GroupDTO,
    Mode,
    Operation,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";
import {
    QuerySaverPresenter,
    QuerySaverViewModel
} from "~/components/AdvancedSearch/QuerySaverDialog/adapters";

import { createMockGateway } from "../utils/MockGateway";

describe("QuerySaverPresenter", () => {
    const id = "any-id";
    const modelId = "model-id";
    const defaultFilter = { field: "", value: "", condition: "" };

    const defaultGroup = {
        operation: Operation.AND,
        filters: [defaultFilter]
    };

    const demoFilter: FilterDTO = {
        field: "any-field",
        value: "any-value",
        condition: "any-condition"
    };
    const demoGroup: GroupDTO = {
        operation: Operation.AND,
        filters: [demoFilter]
    };

    const queryObjectDTO: QueryObjectDTO = {
        id,
        name: "Any name",
        description: "Any description",
        modelId,
        operation: Operation.OR,
        groups: [demoGroup]
    };

    const gateway = createMockGateway({
        create: jest.fn().mockImplementation(() => {
            return Promise.resolve({
                ...queryObjectDTO,
                groups: [JSON.stringify(demoGroup)]
            });
        }),
        update: jest.fn().mockImplementation(() => {
            return Promise.resolve({
                ...queryObjectDTO,
                groups: [JSON.stringify(demoGroup)]
            });
        })
    });

    let repository: QueryObjectRepository;
    let presenter: QuerySaverPresenter;
    let viewModel: QuerySaverViewModel;

    beforeEach(() => {
        jest.clearAllMocks();

        repository = QueryObjectRepository.getInstance(gateway, modelId);
        presenter = new QuerySaverPresenter(repository);
    });

    it("should load a QueryObject into QuerySaverPresenter", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // let's load a queryObjectDTO
        presenter.updateQueryObject(queryObjectDTO);
        expect(viewModel.queryObject).toEqual(queryObjectDTO);

        // let's load a nullish queryObjectDTO
        presenter.updateQueryObject(null);
        expect(viewModel.queryObject).toEqual({
            id: expect.any(String),
            name: "Untitled",
            description: "",
            modelId: modelId,
            operation: "AND",
            groups: [defaultGroup]
        });
    });

    it("should be able to set the queryObject", () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // let's load a queryObjectDTO
        presenter.updateQueryObject(queryObjectDTO);
        expect(viewModel.queryObject).toEqual(queryObjectDTO);

        // should be able to set the `queryObject` name
        presenter.setQueryObject({
            ...viewModel.queryObject,
            name: "Any other name"
        });

        expect(viewModel.queryObject.name).toEqual("Any other name");

        // should be able to set the `queryObject` description
        presenter.setQueryObject({
            ...viewModel.queryObject,
            description: "Any other description"
        });

        expect(viewModel.queryObject.description).toEqual("Any other description");
    });

    it("should perform validation and call provided callbacks `onSubmit`", () => {
        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // let's load a queryObjectDTO
        presenter.updateQueryObject(queryObjectDTO);

        // let's change `name`value so the validation will fail
        presenter.setQueryObject({
            ...viewModel.queryObject,
            name: ""
        });

        presenter.onSubmit(viewModel.queryObject, onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(viewModel.invalidFields).length).toBe(1);

        // let's change back `name`value so the validation will pass
        presenter.setQueryObject({
            ...viewModel.queryObject,
            name: "Any name"
        });

        presenter.onSubmit(viewModel.queryObject, onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(viewModel.invalidFields).toEqual({});
    });

    it("should persist the a brand new queryObject - CREATE", async () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        await presenter.persistQueryObject(queryObjectDTO, Mode.CREATE);
        expect(gateway.create).toBeCalledTimes(1);
        expect(gateway.create).toHaveBeenCalledWith({
            modelId,
            name: "Any name",
            description: "Any description",
            operation: Operation.OR,
            groups: [JSON.stringify(demoGroup)]
        });
    });

    it("should persist the an existing queryObject - UPDATE", async () => {
        presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        await presenter.persistQueryObject(queryObjectDTO, Mode.UPDATE);
        expect(gateway.update).toBeCalledTimes(1);
        expect(gateway.update).toHaveBeenCalledWith({
            id,
            modelId,
            name: "Any name",
            description: "Any description",
            operation: Operation.OR,
            groups: [JSON.stringify(demoGroup)]
        });
    });
});
