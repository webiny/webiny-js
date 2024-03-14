import { BinPresenter } from "./BinPresenter";
import {
    IBinListGateway,
    IBinDeleteEntryGateway,
    IBinPresenter,
    IBinEntryMapper,
    IBinController
} from "~/abstractions";
import { BinIdentity } from "~/types";
import { BinRepository } from "~/domain/BinRepository";
import { BinController } from "~/components/Bin/BinController";

interface Entry {
    id: string;
    title: string;
    createdBy: BinIdentity;
    deletedOn: string;
    deletedBy: BinIdentity;
    custom: string;
}

const identity1: BinIdentity = {
    id: "1234",
    displayName: "John Doe",
    type: "admin"
};

const identity2: BinIdentity = {
    id: "5678",
    displayName: "Jane Doe",
    type: "admin"
};

const createBinListGateway = ({
    execute
}: IBinListGateway<any, Entry>): IBinListGateway<any, Entry> => ({
    execute
});

const createBinDeleteEntryGateway = ({
    execute
}: IBinDeleteEntryGateway): IBinDeleteEntryGateway => ({
    execute
});

class CustomEntryMapper implements IBinEntryMapper<Entry> {
    toDTO(data: Entry) {
        return {
            id: data.id,
            title: data.title,
            createdBy: data.createdBy,
            deletedOn: data.deletedOn,
            deletedBy: data.deletedBy
        };
    }
}
describe("BinPresenter", () => {
    const entry1: Entry = {
        id: "entry-1",
        title: "Entry 1",
        createdBy: identity1,
        deletedBy: identity2,
        deletedOn: new Date().toString(),
        custom: "any custom data"
    };

    const entry2: Entry = {
        id: "entry-2",
        title: "Entry 2",
        createdBy: identity1,
        deletedBy: identity1,
        deletedOn: new Date().toString(),
        custom: "any custom data"
    };

    const entry3: Entry = {
        id: "entry-3",
        title: "Entry 3",
        createdBy: identity2,
        deletedBy: identity2,
        deletedOn: new Date().toString(),
        custom: "any custom data"
    };

    const listGateway = createBinListGateway({
        execute: jest.fn().mockImplementation(() => {
            return Promise.resolve([
                [entry1, entry2, entry3],
                { totalCount: 3, cursor: null, hasMoreItems: false }
            ]);
        })
    });

    const deleteEntryGateway = createBinDeleteEntryGateway({
        execute: jest.fn().mockImplementation(() => {
            return Promise.resolve(true);
        })
    });

    const entryMapper = new CustomEntryMapper();

    let presenter: IBinPresenter;
    let controller: IBinController;

    beforeEach(() => {
        jest.clearAllMocks();

        const repository = new BinRepository(listGateway, deleteEntryGateway, entryMapper);
        presenter = new BinPresenter(repository);
        controller = new BinController(repository);
    });

    it("should create a presenter and list bin entries from the gateway", async () => {
        // let's load some entries from the gateway
        const loadPromise = presenter.load();

        // Let's check the transition to loading state
        expect(presenter.vm).toEqual({
            entries: [],
            loading: true
        });

        await loadPromise;

        expect(listGateway.execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm).toEqual({
            entries: [
                {
                    id: "entry-1",
                    title: "Entry 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                },
                {
                    id: "entry-2",
                    title: "Entry 2",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                },
                {
                    id: "entry-3",
                    title: "Entry 3",
                    createdBy: identity2,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ],
            loading: false
        });
    });

    it("should delete an entry, removing it from the list", async () => {
        // let's load some entries from the gateway
        await presenter.load();

        expect(listGateway.execute).toHaveBeenCalledTimes(1);

        expect(presenter.vm).toEqual({
            entries: [
                {
                    id: "entry-1",
                    title: "Entry 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                },
                {
                    id: "entry-2",
                    title: "Entry 2",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                },
                {
                    id: "entry-3",
                    title: "Entry 3",
                    createdBy: identity2,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ],
            loading: false
        });

        await controller.deleteEntry(entry1.id);

        expect(deleteEntryGateway.execute).toHaveBeenCalledTimes(1);
        expect(deleteEntryGateway.execute).toHaveBeenCalledWith(entry1.id);

        expect(presenter.vm).toEqual({
            entries: [
                {
                    id: "entry-2",
                    title: "Entry 2",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                },
                {
                    id: "entry-3",
                    title: "Entry 3",
                    createdBy: identity2,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ],
            loading: false
        });
    });
});
