import { TrashBinPresenter } from "./TrashBinPresenter";
import {
    ITrashBinListGateway,
    ITrashBinDeleteItemGateway,
    ITrashBinPresenter,
    ITrashBinItemMapper,
    TrashBinRepository,
    SortRepository,
    LoadingRepository,
    MetaRepository
} from "@webiny/app-trash-bin-common";
import { TrashBinIdentity } from "@webiny/app-trash-bin-common/types";
import { useControllers } from "~/components/TrashBin/controllers";
import { ITrashBinControllers } from "~/components/TrashBin/abstractions";

interface Item {
    id: string;
    title: string;
    createdBy: TrashBinIdentity;
    deletedOn: string;
    deletedBy: TrashBinIdentity;
    custom: string;
}

const identity1: TrashBinIdentity = {
    id: "1234",
    displayName: "John Doe",
    type: "admin"
};

const identity2: TrashBinIdentity = {
    id: "5678",
    displayName: "Jane Doe",
    type: "admin"
};

const createBinListGateway = ({
    execute
}: ITrashBinListGateway<Item>): ITrashBinListGateway<Item> => ({
    execute
});

const createBinDeleteItemGateway = ({
    execute
}: ITrashBinDeleteItemGateway): ITrashBinDeleteItemGateway => ({
    execute
});

class CustomItemMapper implements ITrashBinItemMapper<Item> {
    toDTO(data: Item) {
        return {
            id: data.id,
            title: data.title,
            createdBy: data.createdBy,
            deletedOn: data.deletedOn,
            deletedBy: data.deletedBy
        };
    }
}
describe("TrashBinPresenter", () => {
    const item1: Item = {
        id: "item-1",
        title: "Item 1",
        createdBy: identity1,
        deletedBy: identity2,
        deletedOn: new Date().toString(),
        custom: "any custom data"
    };

    const item2: Item = {
        id: "item-2",
        title: "Item 2",
        createdBy: identity1,
        deletedBy: identity1,
        deletedOn: new Date().toString(),
        custom: "any custom data"
    };

    const item3: Item = {
        id: "item-3",
        title: "Item 3",
        createdBy: identity2,
        deletedBy: identity2,
        deletedOn: new Date().toString(),
        custom: "any custom data"
    };

    const listGateway = createBinListGateway({
        execute: jest.fn().mockImplementation(() => {
            return Promise.resolve([
                [item1, item2, item3],
                { totalCount: 3, cursor: null, hasMoreItems: false }
            ]);
        })
    });

    const deleteItemGateway = createBinDeleteItemGateway({
        execute: jest.fn().mockImplementation(() => {
            return Promise.resolve(true);
        })
    });

    const itemMapper = new CustomItemMapper();

    let presenter: ITrashBinPresenter;
    let controllers: ITrashBinControllers;

    beforeEach(() => {
        jest.clearAllMocks();

        const itemRepo = new TrashBinRepository(listGateway, deleteItemGateway, itemMapper);
        const loadingRepo = new LoadingRepository();
        const sortRepo = new SortRepository();
        const metaRepo = new MetaRepository();

        presenter = new TrashBinPresenter(itemRepo, loadingRepo, metaRepo, sortRepo);
        controllers = useControllers(itemRepo, sortRepo, metaRepo);
    });

    it("should create a presenter and list trash bin entries from the gateway", async () => {
        // let's load some entries from the gateway
        const loadPromise = presenter.init();

        // Let's check the transition to loading state
        expect(presenter.vm).toMatchObject({
            entries: []
        });

        await loadPromise;

        expect(listGateway.execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm).toMatchObject({
            entries: [
                {
                    id: "item-1",
                    $selectable: true,
                    title: "Item 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                },
                {
                    id: "item-2",
                    $selectable: true,
                    title: "Item 2",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                },
                {
                    id: "item-3",
                    $selectable: true,
                    title: "Item 3",
                    createdBy: identity2,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ]
        });
    });

    it("should delete an item, removing it from the list", async () => {
        // let's load some entries from the gateway
        await presenter.init();

        expect(listGateway.execute).toHaveBeenCalledTimes(1);

        expect(presenter.vm).toMatchObject({
            entries: [
                {
                    id: "item-1",
                    $selectable: true,
                    title: "Item 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                },
                {
                    id: "item-2",
                    $selectable: true,
                    title: "Item 2",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                },
                {
                    id: "item-3",
                    $selectable: true,
                    title: "Item 3",
                    createdBy: identity2,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ]
        });

        await controllers.deleteItem.execute(item1.id);

        expect(deleteItemGateway.execute).toHaveBeenCalledTimes(1);
        expect(deleteItemGateway.execute).toHaveBeenCalledWith(item1.id);

        expect(presenter.vm).toMatchObject({
            entries: [
                {
                    id: "item-2",
                    $selectable: true,
                    title: "Item 2",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                },
                {
                    id: "item-3",
                    $selectable: true,
                    title: "Item 3",
                    createdBy: identity2,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ]
        });
    });
});
