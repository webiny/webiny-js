import { TrashBinPresenter } from "./TrashBinPresenter";
import { TrashBinIdentity } from "@webiny/app-trash-bin-common/types";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway
} from "@webiny/app-trash-bin-common";
import {
    SelectedItemsRepository,
    SortRepositoryWithDefaults,
    TrashBinItemsRepository,
    TrashBinItemsRepositoryWithLoading
} from "~/components/TrashBin/domain";
import { LoadingRepository, MetaRepository, Sorting, SortingRepository } from "@webiny/app-utils";
import { SearchRepository } from "./domain/SearchRepository";
import { LoadingActions } from "~/types";
import { getUseCases } from "~/components/TrashBin/useCases";
import { getControllers } from "~/components/TrashBin/controllers";

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

const defaultSorting: Sorting[] = [{ field: "deletedOn", order: "desc" }];

describe("TrashBin", () => {
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

    const item4: Item = {
        id: "item-4",
        title: "Item 4",
        createdBy: identity1,
        deletedBy: identity1,
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

    const init = (
        listGateway: ITrashBinListGateway<Item>,
        deleteItemGateway: ITrashBinDeleteItemGateway
    ) => {
        const selectedRepo = new SelectedItemsRepository();
        const loadingRepo = new LoadingRepository();
        const sortRepo = new SortingRepository();
        const sortRepoWithDefaults = new SortRepositoryWithDefaults(defaultSorting, sortRepo);
        const metaRepo = new MetaRepository();
        const searchRepo = new SearchRepository();
        const trashBinItemsRepo = new TrashBinItemsRepository(
            metaRepo,
            listGateway,
            deleteItemGateway,
            itemMapper
        );
        const itemsRepo = new TrashBinItemsRepositoryWithLoading(loadingRepo, trashBinItemsRepo);

        return {
            presenter: new TrashBinPresenter(
                itemsRepo,
                selectedRepo,
                sortRepoWithDefaults,
                searchRepo
            ),
            controllers: getControllers(
                getUseCases(itemsRepo, selectedRepo, sortRepoWithDefaults, searchRepo)
            )
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a presenter and list trash bin entries from the gateway", async () => {
        const { presenter, controllers } = init(listGateway, deleteItemGateway);

        const listPromise = controllers.listItems.execute();

        // Let's check the transition to loading state
        expect(presenter.vm).toMatchObject({
            items: [],
            loading: {
                [LoadingActions.list]: true
            }
        });

        await listPromise;

        expect(listGateway.execute).toHaveBeenCalledTimes(1);
        expect(listGateway.execute).toHaveBeenCalledWith({
            sort: ["deletedOn_DESC"]
        });

        expect(presenter.vm).toMatchObject({
            items: [
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
            ],
            loading: {
                [LoadingActions.list]: false
            }
        });
    });

    it("should list more items from the gateway", async () => {
        const listGateway = createBinListGateway({
            execute: jest
                .fn()
                .mockImplementationOnce(() => {
                    return Promise.resolve([
                        [item1, item2, item3],
                        { totalCount: 4, cursor: "IjMi", hasMoreItems: true }
                    ]);
                })
                .mockImplementationOnce(() => {
                    return Promise.resolve([
                        [item4],
                        { totalCount: 4, cursor: null, hasMoreItems: false }
                    ]);
                })
        });

        const { presenter, controllers } = init(listGateway, deleteItemGateway);

        // Let's list some initial entries
        await controllers.listItems.execute();
        expect(listGateway.execute).toHaveBeenCalledTimes(1);

        // Let's list more items from the gateway
        const listMorePromise = controllers.listMoreItems.execute();

        expect(presenter.vm).toMatchObject({
            loading: {
                [LoadingActions.listMore]: true
            }
        });

        await listMorePromise;

        expect(listGateway.execute).toHaveBeenCalledTimes(2);
        expect(listGateway.execute).toHaveBeenCalledWith({
            after: "IjMi",
            search: undefined,
            sort: ["deletedOn_DESC"]
        });

        expect(presenter.vm).toMatchObject({
            items: [
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
                },
                {
                    id: "item-4",
                    $selectable: true,
                    title: "Item 4",
                    createdBy: identity1,
                    deletedBy: identity1,
                    deletedOn: expect.any(String)
                }
            ],
            loading: {
                [LoadingActions.listMore]: false
            }
        });
    });

    it("should be able to sort items", async () => {
        const sortListGateway = createBinListGateway({
            execute: jest
                .fn()
                .mockImplementationOnce(() => {
                    return Promise.resolve([
                        [item1, item2, item3],
                        { totalCount: 3, cursor: null, hasMoreItems: false }
                    ]);
                })
                .mockImplementation(() => {
                    return Promise.resolve([
                        [item3, item2, item1],
                        { totalCount: 3, cursor: null, hasMoreItems: false }
                    ]);
                })
        });

        const { presenter, controllers } = init(sortListGateway, deleteItemGateway);

        // let's list some entries from the gateway
        await controllers.listItems.execute();

        expect(sortListGateway.execute).toHaveBeenNthCalledWith(1, {
            sort: ["deletedOn_DESC"]
        });

        // Let's sort items, it should call back the list gateway to retrieve the items sorted
        await controllers.sortItems.execute(() => [{ id: "deletedOn", desc: false }]);

        expect(sortListGateway.execute).toHaveBeenNthCalledWith(2, {
            sort: ["deletedOn_ASC"]
        });

        expect(presenter.vm).toMatchObject({
            items: [
                {
                    id: "item-3",
                    $selectable: true,
                    title: "Item 3",
                    createdBy: identity2,
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
                    id: "item-1",
                    $selectable: true,
                    title: "Item 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ],
            loading: {
                [LoadingActions.list]: false
            },
            sorting: [{ id: "deletedOn", desc: false }]
        });
    });

    it("should be able to search items", async () => {
        const searchItemsGateway = createBinListGateway({
            execute: jest
                .fn()
                .mockImplementationOnce(() => {
                    return Promise.resolve([
                        [item1, item2, item3],
                        { totalCount: 3, cursor: null, hasMoreItems: false }
                    ]);
                })
                .mockImplementationOnce(() => {
                    return Promise.resolve([
                        [item1],
                        { totalCount: 1, cursor: null, hasMoreItems: false }
                    ]);
                })
                .mockImplementationOnce(() => {
                    return Promise.resolve([
                        [],
                        { totalCount: 0, cursor: null, hasMoreItems: false }
                    ]);
                })
        });

        const { presenter, controllers } = init(searchItemsGateway, deleteItemGateway);

        // let's list some entries from the gateway
        await controllers.listItems.execute();

        expect(searchItemsGateway.execute).toHaveBeenNthCalledWith(1, {
            sort: ["deletedOn_DESC"]
        });

        // Let's search for items, it should return items from the gateway
        await controllers.searchItems.execute("Item 1");

        expect(searchItemsGateway.execute).toHaveBeenNthCalledWith(2, {
            sort: ["deletedOn_DESC"],
            search: "Item 1"
        });

        expect(presenter.vm).toMatchObject({
            items: [
                {
                    id: "item-1",
                    $selectable: true,
                    title: "Item 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ],
            loading: {
                [LoadingActions.list]: false
            },
            searchQuery: "Item 1"
        });

        // Let's search for items, it should return no items from the gateway
        await controllers.searchItems.execute("Not found query");

        expect(searchItemsGateway.execute).toHaveBeenNthCalledWith(3, {
            sort: ["deletedOn_DESC"],
            search: "Not found query"
        });

        expect(presenter.vm).toMatchObject({
            items: [],
            loading: {
                [LoadingActions.list]: false
            },
            searchQuery: "Not found query",
            isEmptyView: true
        });
    });

    it("should be able to select items", async () => {
        const { presenter, controllers } = init(listGateway, deleteItemGateway);

        // let's list some entries from the gateway
        await controllers.listItems.execute();

        // No selected items found by default
        expect(presenter.vm).toMatchObject({
            selectedItems: []
        });

        // Let's select the first Item
        await controllers.selectItems.execute([
            {
                id: "item-1",
                $selectable: true,
                title: "Item 1",
                createdBy: identity1,
                deletedBy: identity2,
                deletedOn: new Date().toString()
            }
        ]);

        expect(presenter.vm).toMatchObject({
            selectedItems: [
                {
                    id: "item-1",
                    $selectable: true,
                    title: "Item 1",
                    createdBy: identity1,
                    deletedBy: identity2,
                    deletedOn: expect.any(String)
                }
            ]
        });

        // Let's select the second item
        await controllers.selectItems.execute([
            {
                id: "item-1",
                $selectable: true,
                title: "Item 1",
                createdBy: identity1,
                deletedBy: identity2,
                deletedOn: new Date().toString()
            },
            {
                id: "item-2",
                $selectable: true,
                title: "Item 2",
                createdBy: identity1,
                deletedBy: identity1,
                deletedOn: new Date().toString()
            }
        ]);

        expect(presenter.vm).toMatchObject({
            selectedItems: [
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
                }
            ]
        });
    });

    it("should delete an item, removing it from the list", async () => {
        const { presenter, controllers } = init(listGateway, deleteItemGateway);

        // let's list some entries from the gateway
        await controllers.listItems.execute();

        expect(listGateway.execute).toHaveBeenCalledTimes(1);

        expect(presenter.vm).toMatchObject({
            items: [
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

        const deletePromise = controllers.deleteItem.execute(item1.id);

        // Let's check the transition to loading state
        expect(presenter.vm).toMatchObject({
            loading: {
                [LoadingActions.delete]: true
            }
        });

        await deletePromise;

        expect(deleteItemGateway.execute).toHaveBeenCalledTimes(1);
        expect(deleteItemGateway.execute).toHaveBeenCalledWith(item1.id);

        expect(presenter.vm).toMatchObject({
            items: [
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
