import { TreePresenter } from "./TreePresenter";

describe("TreePresenter", () => {
    it("should return the compatible `vm` based on params", () => {
        const presenter = new TreePresenter();

        // `nodes`
        {
            presenter.initNodes([
                {
                    id: "1",
                    label: "Node 1",
                    parentId: "0"
                }
            ]);

            expect(presenter.vm.nodes).toEqual([
                {
                    id: "1",
                    text: "Node 1",
                    parent: "0",
                    droppable: true,
                    data: {
                        id: "1",
                        label: "Node 1",
                        parentId: "0",
                        droppable: true,
                        active: false,
                        loading: false
                    }
                }
            ]);
        }

        // `nodes` with droppable
        {
            presenter.initNodes([
                {
                    id: "2",
                    label: "Node 2",
                    parentId: "0",
                    droppable: true
                }
            ]);

            expect(presenter.vm.nodes).toEqual([
                {
                    id: "2",
                    text: "Node 2",
                    parent: "0",
                    droppable: true,
                    data: {
                        id: "2",
                        label: "Node 2",
                        parentId: "0",
                        droppable: true,
                        active: false,
                        loading: false
                    }
                }
            ]);
        }

        // `nodes` with data
        {
            presenter.initNodes([
                {
                    id: "3",
                    label: "Node 3",
                    parentId: "0",
                    data: { customData: "value" }
                }
            ]);

            expect(presenter.vm.nodes).toEqual([
                {
                    id: "3",
                    text: "Node 3",
                    parent: "0",
                    droppable: true,
                    data: {
                        id: "3",
                        label: "Node 3",
                        parentId: "0",
                        droppable: true,
                        active: false,
                        loading: false,
                        customData: "value"
                    }
                }
            ]);
        }

        // `nodes` with active
        {
            presenter.initNodes([
                {
                    id: "4",
                    label: "Node 4",
                    parentId: "0",
                    active: true
                }
            ]);

            expect(presenter.vm.nodes).toEqual([
                {
                    id: "4",
                    text: "Node 4",
                    parent: "0",
                    droppable: true,
                    data: {
                        id: "4",
                        label: "Node 4",
                        parentId: "0",
                        droppable: true,
                        active: true,
                        loading: false
                    }
                }
            ]);
        }

        // `rootId`
        {
            presenter.initNodes([
                {
                    id: "4",
                    label: "Node 4",
                    parentId: "0"
                }
            ]);

            presenter.init({
                rootId: "4"
            });

            expect(presenter.vm.rootId).toBe("4");
        }

        // `defaultOpenNodeIds`
        {
            presenter.initNodes([
                {
                    id: "5",
                    label: "Node 5",
                    parentId: "0"
                }
            ]);

            presenter.init({
                defaultOpenNodeIds: ["5"]
            });

            expect(presenter.vm.openNodeIds).toEqual(["5"]);
        }

        // `defaultLockedOpenNodeIds`
        {
            presenter.initNodes([
                {
                    id: "6",
                    label: "Node 6",
                    parentId: "0"
                }
            ]);

            presenter.init({
                defaultLockedOpenNodeIds: ["6"]
            });

            expect(presenter.vm.lockedOpenNodeIds).toEqual(["6"]);
        }

        // `loadingNodeIds`
        {
            presenter.initNodes([
                {
                    id: "7",
                    label: "Node 7",
                    parentId: "0"
                }
            ]);

            presenter.init({
                loadingNodeIds: ["7"]
            });

            expect(presenter.vm.loadingNodeIds).toEqual(["7"]);
            expect(presenter.vm.nodes[0].data.loading).toBe(true);
        }
    });

    it("should handle drop and update nodes correctly", async () => {
        const presenter = new TreePresenter();

        presenter.initNodes([
            {
                id: "1",
                label: "Node 1",
                parentId: "0"
            },
            {
                id: "2",
                label: "Node 2",
                parentId: "0"
            }
        ]);

        await presenter.handleDrop([
            {
                id: "1",
                label: "Node 1 Updated",
                parentId: "2",
                droppable: true
            },
            {
                id: "2",
                label: "Node 2 Updated",
                parentId: "0",
                droppable: true
            }
        ]);

        expect(presenter.vm.nodes).toEqual([
            {
                id: "1",
                text: "Node 1 Updated",
                parent: "2",
                droppable: true,
                data: {
                    id: "1",
                    label: "Node 1 Updated",
                    parentId: "2",
                    droppable: true,
                    active: false,
                    loading: false
                }
            },
            {
                id: "2",
                text: "Node 2 Updated",
                parent: "0",
                droppable: true,
                data: {
                    id: "2",
                    label: "Node 2 Updated",
                    parentId: "0",
                    droppable: true,
                    active: false,
                    loading: false
                }
            }
        ]);
    });
});
