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

describe(`graphql "and" queries`, () => {
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

    const execTest = manager.storageOperations.name.match("elasticsearch") !== null ? it : it.skip;

    beforeEach(async () => {
        await createCategories();

        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => {
                return data.listCategories.data.length === categories.length;
            },
            {
                name: "list all categories",
                tries: 20,
                debounce: 2000,
                wait: 2000
            }
        );
    });

    execTest(`should find a single item containing "cms" and "headless" words`, async () => {
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
        /**
         * As we are using possibility to skip the test, we need to disable eslint in next line as it will produce error
         */
        // eslint-disable-next-line
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

    execTest(`should find all items containing "webiny" and "builder" words`, async () => {
        const [categoriesResponse] = await listCategories({
            where: {
                AND: [
                    {
                        title_contains: "webiny"
                    },
                    {
                        title_contains: "builder"
                    }
                ]
            }
        });

        /**
         * As we are using possibility to skip the test, we need to disable eslint in next line as it will produce error
         */
        // eslint-disable-next-line
        expect(categoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Webiny Form Builder"
                        },
                        {
                            title: "Webiny Page Builder"
                        }
                    ],
                    meta: {
                        totalCount: 2,
                        cursor: null,
                        hasMoreItems: false
                    },
                    error: null
                }
            }
        });
    });

    execTest(
        `should not find any items containing "cms", "headless" and "localization" words`,
        async () => {
            const [categoriesResponse] = await listCategories({
                where: {
                    title_contains: "cms",
                    AND: [
                        {
                            title_contains: "headless"
                        },
                        {
                            title_contains: "localization"
                        }
                    ]
                }
            });

            /**
             * As we are using possibility to skip the test, we need to disable eslint in next line as it will produce error
             */
            // eslint-disable-next-line
            expect(categoriesResponse).toMatchObject({
                data: {
                    listCategories: {
                        data: [],
                        meta: {
                            totalCount: 0,
                            cursor: null,
                            hasMoreItems: false
                        },
                        error: null
                    }
                }
            });
        }
    );
});
