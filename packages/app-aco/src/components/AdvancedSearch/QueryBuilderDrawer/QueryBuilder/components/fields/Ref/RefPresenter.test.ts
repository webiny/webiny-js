import { RefPresenter } from "./RefPresenter";
import { EntryReference, EntryRepository } from "./domain";
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

    const entry1: EntryReference = {
        id: "id-1",
        entryId: "entryId-1",
        title: "Entry 1",
        model: {
            modelId
        }
    };

    const entry2: EntryReference = {
        id: "id-2",
        entryId: "entryId-2",
        title: "Entry 2",
        model: {
            modelId
        }
    };

    const entry3: EntryReference = {
        id: "id-3",
        entryId: "entryId-3",
        title: "Entry 3",
        model: {
            modelId
        }
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
        const repository = new EntryRepository(gateway, [modelId]);
        presenter = new RefPresenter(repository);
    });

    it("should load an existing entry by passing a tuple composed by `entryId` and `modelId`", async () => {
        const entryId = "entryId-1";
        const value = JSON.stringify({ entryId, modelId });
        const loadPromise = presenter.load(value);

        // Let's check the transition to loading state
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: true,
            options: []
        });

        await loadPromise;

        // should fetch the entry from the gateway
        expect(gateway.get).toHaveBeenCalledTimes(1);
        expect(gateway.get).toHaveBeenCalledWith(modelId, entryId);

        // should update the `vm` and set the `currentEntry`
        expect(presenter.vm).toEqual({
            selected: {
                id: entry1.id,
                entryId: entry1.entryId,
                name: entry1.title,
                modelId
            },
            loading: false,
            options: [
                {
                    id: entry1.id,
                    entryId: entry1.entryId,
                    name: entry1.title,
                    modelId
                }
            ]
        });
    });

    it("should NOT load an existing entry if `entryId` is undefined", async () => {
        await presenter.load();

        // should NOT fetch the entry from the gateway
        expect(gateway.get).toHaveBeenCalledTimes(0);

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
        expect(gateway.list).toHaveBeenCalledTimes(1);
        expect(gateway.list).toHaveBeenCalledWith([modelId], query);

        // let's check the current `vm`
        // be aware: data comes from the mocked gateway
        expect(presenter.vm).toEqual({
            selected: undefined,
            loading: false,
            options: [
                {
                    id: entry1.id,
                    entryId: entry1.entryId,
                    name: entry1.title,
                    modelId
                },
                {
                    id: entry2.id,
                    entryId: entry2.entryId,
                    name: entry2.title,
                    modelId
                },
                {
                    id: entry3.id,
                    entryId: entry3.entryId,
                    name: entry3.title,
                    modelId
                }
            ]
        });
    });
});
