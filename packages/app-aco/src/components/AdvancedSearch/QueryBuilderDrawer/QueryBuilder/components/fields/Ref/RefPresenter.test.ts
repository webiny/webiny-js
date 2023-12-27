import { RefPresenter } from "./RefPresenter";
import { EntryDTO, EntryRepository } from "./domain";
import { EntriesGatewayInterface } from "./gateways";

const mockGateway: EntriesGatewayInterface = {
    list: jest.fn(),
    get: jest.fn()
};

const createMockGateway = ({
    list,
    get
}: Partial<EntriesGatewayInterface>): EntriesGatewayInterface => ({
    ...mockGateway,
    ...(list && { list }),
    ...(get && { get })
});

describe("RefPresenter", () => {
    const modelId = "modelId-demo";

    const entry1: EntryDTO = {
        id: "id-1",
        entryId: "entryId-1",
        title: "Entry 1"
    };

    const entry2: EntryDTO = {
        id: "id-2",
        entryId: "entryId-2",
        title: "Entry 2"
    };

    const entry3: EntryDTO = {
        id: "id-3",
        entryId: "entryId-3",
        title: "Entry 3"
    };

    const gateway = createMockGateway({
        list: jest.fn().mockImplementation(() => {
            return Promise.resolve([entry1, entry2, entry3]);
        }),
        get: jest.fn().mockImplementation(() => {
            return Promise.resolve(entry1);
        })
    });

    let presenter: RefPresenter;

    beforeEach(() => {
        jest.clearAllMocks();
        const repository = new EntryRepository(gateway, modelId);
        presenter = new RefPresenter(repository);
    });

    it("should load an existing entry by passing the `entryId`", async () => {
        const entryId = "entryId-1";
        const loadPromise = presenter.load(entryId);

        // Let's check the transition to loading state
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: true,
            options: []
        });

        await loadPromise;

        // should fetch the entry from the gateway
        expect(gateway.get).toBeCalledTimes(1);
        expect(gateway.get).toBeCalledWith(modelId, entryId);

        // should update the `vm` and set the `currentEntry`
        expect(presenter.vm).toEqual({
            selected: {
                id: entryId,
                name: "Entry 1"
            },
            loading: false,
            options: [
                {
                    id: entryId,
                    name: "Entry 1"
                }
            ]
        });
    });

    it("should NOT load an existing entry if `entryId` is undefined", async () => {
        await presenter.load();

        // should NOT fetch the entry from the gateway
        expect(gateway.get).toBeCalledTimes(0);

        // should not update the `vm`
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: false,
            options: []
        });
    });

    it("should search entries by listing from the gateway", async () => {
        const query = "any query";

        await presenter.load();

        // let's check the current `vm`
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: false,
            options: []
        });

        const searchPromise = presenter.search(query);

        // Let's check the transition to loading state
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: true,
            options: []
        });

        await searchPromise;

        // should fetch the entries from the gateway
        expect(gateway.list).toBeCalledTimes(1);
        expect(gateway.list).toBeCalledWith(modelId, query);

        // let's check the current `vm`
        // be aware: data comes from the mocked gateway
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: false,
            options: [
                {
                    id: entry1.entryId,
                    name: entry1.title
                },
                {
                    id: entry2.entryId,
                    name: entry2.title
                },
                {
                    id: entry3.entryId,
                    name: entry3.title
                }
            ]
        });
    });
});
