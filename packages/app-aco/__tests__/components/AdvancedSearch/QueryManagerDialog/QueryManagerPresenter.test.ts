import {
    QueryManagerPresenter,
    QueryManagerViewModel
} from "~/components/AdvancedSearch/QueryManagerDialog/adapters";
import {
    FilterDTO,
    GroupDTO,
    Operation,
    QueryObjectDTO,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

import { createMockGateway } from "../utils/MockGateway";

describe("QueryManagerPresenter", () => {
    const id = "any-id";
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

    const queryObjectDTO: QueryObjectDTO = {
        id,
        name: "Any name",
        description: "Any description",
        modelId,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const gateway = createMockGateway({
        list: jest.fn().mockImplementation(() => {
            return Promise.resolve([
                {
                    ...queryObjectDTO,
                    groups: [JSON.stringify(demoGroup)]
                }
            ]);
        }),
        delete: jest.fn().mockImplementation(() => {
            return Promise.resolve(true);
        })
    });

    let repository: QueryObjectRepository;
    let presenter: QueryManagerPresenter;
    let viewModel: QueryManagerViewModel;

    beforeEach(() => {
        jest.clearAllMocks();

        repository = new QueryObjectRepository(gateway, modelId);
        presenter = new QueryManagerPresenter(repository);
        viewModel = {
            filters: []
        };
    });

    it("should load, listing the filters via the provided gateway", async () => {
        await presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        expect(gateway.list).toBeCalledTimes(1);
        expect(viewModel.filters).toEqual([queryObjectDTO]);
    });

    it("should delete a filter, via the provided gateway", async () => {
        // Let's load first
        await presenter.load(generatedViewModel => {
            viewModel = generatedViewModel;
        });

        // Let's delete the filter
        await presenter.deleteFilter(id);

        expect(gateway.delete).toBeCalledTimes(1);
        expect(viewModel.filters).toEqual([]);
    });

    it("should handle errors received while loading", async () => {
        const errorMessage = "Any Error";

        const badGateway = createMockGateway({
            list: jest.fn().mockImplementation(() => {
                throw new Error(errorMessage);
            })
        });

        const repository = new QueryObjectRepository(badGateway, modelId);
        const presenter = new QueryManagerPresenter(repository);

        try {
            await presenter.load(generatedViewModel => {
                viewModel = generatedViewModel;
            });

            expect(badGateway.list).toBeCalledTimes(1);
            expect(viewModel.filters).toEqual([]);
        } catch (e) {
            expect(e.message).toEqual(errorMessage);
        }
    });

    it("should handle errors received while deleting a filter", async () => {
        const errorMessage = "Any Error";

        const badGateway = createMockGateway({
            ...gateway,
            delete: jest.fn().mockImplementation(() => {
                throw new Error(errorMessage);
            })
        });

        const repository = new QueryObjectRepository(badGateway, modelId);
        const presenter = new QueryManagerPresenter(repository);

        try {
            // Let's load first
            await presenter.load(generatedViewModel => {
                viewModel = generatedViewModel;
            });

            expect(viewModel.filters).toEqual([queryObjectDTO]);

            // Let's delete the filter
            await presenter.deleteFilter(id);

            expect(gateway.delete).toBeCalledTimes(1);
            expect(viewModel.filters).toEqual([queryObjectDTO]);
        } catch (e) {
            expect(e.message).toEqual(errorMessage);
        }
    });
});
