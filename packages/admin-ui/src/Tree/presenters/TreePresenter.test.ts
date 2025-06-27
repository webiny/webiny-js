import { TreePresenter } from "./TreePresenter";

describe("TreePresenter", () => {
    it("should return the compatible `vm` based on params", () => {
        const presenter = new TreePresenter();

        // `nodes`
        {
            presenter.init({
                nodes: [
                    {
                        id: "1",
                        label: "Node 1",
                        parentId: "0"
                    }
                ]
            });

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
            presenter.init({
                nodes: [
                    {
                        id: "2",
                        label: "Node 2",
                        parentId: "0",
                        droppable: true
                    }
                ]
            });

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
            presenter.init({
                nodes: [
                    {
                        id: "3",
                        label: "Node 3",
                        parentId: "0",
                        data: { customData: "value" }
                    }
                ]
            });

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
            presenter.init({
                nodes: [
                    {
                        id: "4",
                        label: "Node 4",
                        parentId: "0",
                        active: true
                    }
                ]
            });

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

        // `nodes` with loading
        {
            presenter.init({
                nodes: [
                    {
                        id: "4",
                        label: "Node 4",
                        parentId: "0",
                        loading: true
                    }
                ]
            });

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
                        active: false,
                        loading: true
                    }
                }
            ]);
        }

        // `rootId`
        {
            presenter.init({
                nodes: [
                    {
                        id: "4",
                        label: "Node 4",
                        parentId: "0"
                    }
                ],
                rootId: "4"
            });

            expect(presenter.vm.rootId).toBe("4");
        }

        // `defaultOpenNodeIds`
        {
            presenter.init({
                nodes: [
                    {
                        id: "5",
                        label: "Node 5",
                        parentId: "0"
                    }
                ],
                defaultOpenNodeIds: ["5"]
            });

            expect(presenter.vm.openNodeIds).toEqual(["5"]);
        }

        // `defaultLockedOpenNodeIds`
        {
            presenter.init({
                nodes: [
                    {
                        id: "6",
                        label: "Node 6",
                        parentId: "0"
                    }
                ],
                defaultLockedOpenNodeIds: ["6"]
            });

            expect(presenter.vm.lockedOpenNodeIds).toEqual(["6"]);
        }
    });
});
