import { Operations } from "~/Operations";

describe("Operations", () => {
    it("should insert an item", async () => {
        const operations = new Operations();

        operations.insert({
            id: "1",
            index: "test-index",
            data: {
                title: "Hello World"
            }
        });

        expect(operations.items).toEqual([
            {
                index: {
                    _id: "1",
                    _index: "test-index"
                }
            },
            {
                title: "Hello World"
            }
        ]);

        expect(operations.total).toBe(2);
    });

    it("should modify an item", async () => {
        const operations = new Operations();

        operations.modify({
            id: "1",
            index: "test-index",
            data: {
                title: "Hello World"
            }
        });

        expect(operations.items).toEqual([
            {
                index: {
                    _id: "1",
                    _index: "test-index"
                }
            },
            {
                title: "Hello World"
            }
        ]);

        expect(operations.total).toBe(2);
    });

    it("should delete an item", async () => {
        const operations = new Operations();

        operations.delete({
            id: "1",
            index: "test-index"
        });

        expect(operations.items).toEqual([
            {
                delete: {
                    _id: "1",
                    _index: "test-index"
                }
            }
        ]);

        expect(operations.total).toBe(1);
    });

    it("should insert, update and delete items", async () => {
        const operations = new Operations();

        operations.insert({
            id: "1",
            index: "test-index",
            data: {
                title: "Hello World"
            }
        });

        operations.modify({
            id: "2",
            index: "test-index-2",
            data: {
                title: "Hello World 2"
            }
        });

        operations.delete({
            id: "1",
            index: "test-index"
        });

        expect(operations.items).toEqual([
            {
                index: {
                    _id: "1",
                    _index: "test-index"
                }
            },
            {
                title: "Hello World"
            },
            {
                index: {
                    _id: "2",
                    _index: "test-index-2"
                }
            },
            {
                title: "Hello World 2"
            },
            {
                delete: {
                    _id: "1",
                    _index: "test-index"
                }
            }
        ]);

        expect(operations.total).toBe(5);
    });
});
