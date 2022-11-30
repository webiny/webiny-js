import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import lodashCamelCase from "lodash/camelCase";
import { setupGroupAndModels } from "../testHelpers/setup";

const categories = [
    "Webiny Headless CMS",
    "Webiny Page Builder",
    "Webiny Form Builder",
    "File Manager Webiny",
    "Localization"
];

describe("nested queries", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const { createCategory, listCategories, until } = manager;

    const createCategories = async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        for (const title of categories) {
            await createCategory({
                data: {
                    title,
                    slug: lodashCamelCase(title)
                }
            });
        }
    };

    it("should perform a single AND nested query", async () => {
        await createCategories();

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => {
                return data.listCategories.data.length === categories.length;
            },
            {
                name: "list all fruits",
                tries: 20,
                debounce: 2000,
                wait: 2000
            }
        );

        const [categoriesResponse] = await listCategories({
            where: {
                AND: [
                    {
                        title_contains: "cms"
                    },
                    {
                        title_contains: "headless"
                    }
                ]
            }
        });

        expect(categoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Headless CMS"
                        }
                    ],
                    meta: {
                        totalCount: 1,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });
    });
});
