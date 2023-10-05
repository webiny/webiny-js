import { QueryManagerPresenter } from "~/components/AdvancedSearch/QueryManagerDialog/adapters";
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

    beforeEach(() => {
        jest.clearAllMocks();

        repository = QueryObjectRepository.getInstance(gateway, modelId);
        presenter = new QueryManagerPresenter(repository);
    });

    it("should load, listing the filters via the provided gateway", async () => {
        await presenter.load();

        expect(gateway.list).toBeCalledTimes(1);
        expect(presenter.getViewModel().filters).toEqual([queryObjectDTO]);
    });

    it("should delete a filter, via the provided gateway", async () => {
        // Let's load first
        await presenter.load();

        // Let's delete the filter
        await presenter.deleteFilter(id);

        expect(gateway.delete).toBeCalledTimes(1);
        expect(presenter.getViewModel().filters).toEqual([]);
    });
});
