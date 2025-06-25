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
                        text: "Node 1",
                        parentId: "0"
                    }
                ]
            });

            expect(presenter.vm.nodes).toEqual([
                {
                    id: "1",
                    text: "Node 1",
                    parent: "0",
                    droppable: false,
                    data: {}
                }
            ]);
        }

        // `nodes` with droppable
        {
            presenter.init({
                nodes: [
                    {
                        id: "2",
                        text: "Node 2",
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
                    data: {}
                }
            ]);
        }

        // `nodes` with data
        {
            presenter.init({
                nodes: [
                    {
                        id: "3",
                        text: "Node 3",
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
                    droppable: false,
                    data: { customData: "value" }
                }
            ]);
        }

        // `rootId`
        {
            presenter.init({
                nodes: [
                    {
                        id: "4",
                        text: "Node 4",
                        parentId: "0"
                    }
                ],
                rootId: "4"
            });

            expect(presenter.vm.rootId).toBe("4");
        }

        // `defaultOpenNodesIds`
        {
            presenter.init({
                nodes: [
                    {
                        id: "5",
                        text: "Node 5",
                        parentId: "0"
                    }
                ],
                defaultOpenNodesIds: ["5"]
            });

            expect(presenter.vm.openNodesId).toEqual(["5"]);
        }
    });
});
