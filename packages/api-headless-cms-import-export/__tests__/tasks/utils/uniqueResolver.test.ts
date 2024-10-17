import { UniqueResolver } from "~/tasks/utils/uniqueResolver/UniqueResolver";
import { assets, IMockAsset } from "~tests/mocks/assets";

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

    it("should return unique values only - large dataset", async () => {
        const resolver = new UniqueResolver<IMockAsset>();

        const result = resolver.resolve(
            [
                ...assets,
                ...assets,
                {
                    url: "aMockUrl",
                    key: "aMockKeyWhichDefinitelyDoesNotExistInTheDataset"
                }
            ],
            "key"
        );

        expect(result).toHaveLength(assets.length + 1);

        const extraAsset: IMockAsset = {
            url: "aMockUrl-2",
            key: "aMockKeyWhichDefinitelyDoesNotExistInTheDataset-2"
        };
        const anotherResult = resolver.resolve([...assets, ...assets, extraAsset], "key");

        expect(anotherResult).toEqual([extraAsset]);
    });
});
