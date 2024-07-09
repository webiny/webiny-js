import { UniqueResolver } from "~/tasks/utils/uniqueResolver/UniqueResolver";

interface IItem {
    id: string;
}

describe("unique resolver", () => {
    it("should return unique values only", async () => {
        const resolver = new UniqueResolver<IItem>();

        const items: IItem[] = [
            {
                id: "1"
            },
            {
                id: "2"
            },
            {
                id: "3"
            },
            {
                id: "1"
            }
        ];

        const expected = [
            {
                id: "1"
            },
            {
                id: "2"
            },
            {
                id: "3"
            }
        ];

        const result = resolver.resolve(items, "id");

        expect(result).toEqual(expected);

        /**
         * Must return nothing because unique values were returned with last call.
         */
        const anotherResult = resolver.resolve(items, "id");

        expect(anotherResult).toEqual([]);

        const yetAnotherItems: IItem[] = [
            {
                id: "4"
            },
            {
                id: "5"
            },
            {
                id: "4"
            }
        ];

        const yetAnotherResult = resolver.resolve(yetAnotherItems, "id");

        expect(yetAnotherResult).toEqual([
            {
                id: "4"
            },
            {
                id: "5"
            }
        ]);
    });
});
