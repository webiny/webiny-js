import { setupContentModelGroup, setupContentModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { CmsEntry } from "~/types";
import { toSlug } from "~/utils/toSlug";
import { useCategoryReadHandler } from "~tests/testHelpers/useCategoryReadHandler";
import { parseIdentifier } from "@webiny/utils";

jest.setTimeout(100000);

interface CreateCategoryParams {
    amount?: number;
    title: string;
    slug: string;
}
type Categories = Result[];
interface Result {
    category: CmsEntry;
    revisions: CmsEntry[];
}

describe("delete multiple entries", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });
    const reader = useCategoryReadHandler({
        path: "read/en-US"
    });

    const createCategory = async (input: CreateCategoryParams) => {
        const { amount, ...data } = input;
        const [createResponse] = await manager.createCategory({
            data: {
                ...data
            }
        });
        const category = createResponse.data.createCategory.data;
        if (!amount) {
            return { category, revisions: [] };
        }
        let prev = category;
        const revisions: CmsEntry[] = [];
        for (let current = 1; current <= amount; current++) {
            await manager.publishCategory({
                revision: prev.id
            });
            const [createFromResponse] = await manager.createCategoryFrom({
                revision: prev.id,
                data: {
                    title: `${data.title} ${current}`,
                    slug: `${data.slug}-${current}`
                }
            });
            const revision = createFromResponse.data.createCategoryFrom.data;
            prev = revision;
            revisions.push(revision);
        }
        return {
            category,
            revisions
        };
    };

    const titles = [
        "Space Exploration",
        "Food Production",
        "Tech Industry",
        "Mental Health",
        "Maritime Industry",
        "Space Industry",
        "Bug Reporting",
        "Car Reviews",
        "Mobile Phone Reviews",
        "Movie Reviews",
        "Book Reviews",
        "Music Reviews",
        "Game Reviews",
        "TV Show Reviews"
    ];

    const createCategories = async () => {
        const results: Categories = [];
        for (const title of titles) {
            const result = await createCategory({
                amount: 3,
                title,
                slug: toSlug(title)
            });
            results.push(result);
        }
        return results;
    };

    it("should delete all entries with the given IDs", async () => {
        const group = await setupContentModelGroup(manager);
        await setupContentModels(manager, group, ["category"]);

        const results = await createCategories();

        const [validateLatestResponse] = await manager.listCategories({
            limit: 100
        });
        expect(validateLatestResponse.data.listCategories.data).toHaveLength(titles.length);
        const [validatePublishedResponse] = await reader.listCategories({
            limit: 100
        });
        expect(validatePublishedResponse.data.listCategories.data).toHaveLength(titles.length);

        const entries = results.map(r => r.category.id);
        /**
         * Let's now delete all the entries.
         */
        const [deleteResponse] = await manager.deleteCategories(entries);
        /**
         * ... and check that all are deleted (response).
         */
        expect(deleteResponse).toMatchObject({
            data: {
                deleteCategories: {
                    error: null
                }
            }
        });
        expect(deleteResponse.data.deleteCategories.data).toHaveLength(entries.length);

        for (const { id } of deleteResponse.data.deleteCategories.data) {
            const { id: entryId } = parseIdentifier(id);
            const exists = results.some(result => {
                return entryId === result.category.entryId;
            });
            expect(exists).toBe(true);
        }
        /**
         * Next thing is we will get each of the revisions and check that the API throws not found error.
         * The manage API.
         */
        const revisions = results.map(r => r.revisions).flat();
        for (const revision of revisions) {
            const [result] = await manager.getCategory({ revision: revision.id });
            expect(result).toMatchObject({
                data: {
                    getCategory: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: expect.any(String)
                        }
                    }
                }
            });
        }

        /**
         * ... then the read API.
         */
        for (const revision of revisions) {
            let [result] = await reader.getCategory({
                where: {
                    id: revision.id
                }
            });
            /**
             * In case of the entry still existing, let's run a check again (Elasticsearch is not realtime).
             */
            if (result.data.getCategory.data) {
                [result] = await reader.getCategory({
                    where: {
                        id: revision.id
                    }
                });
            }

            expect(result).toMatchObject({
                data: {
                    getCategory: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: expect.any(String)
                        }
                    }
                }
            });
        }
        /**
         * Then let's check that nothing is in the latest list.
         */
        const [latestResponse] = await manager.listCategories();
        expect(latestResponse.data.listCategories.data).toHaveLength(0);
        expect(latestResponse.data.listCategories.error).toBeNull();
        /**
         * And finally,  let's check that nothing is in the published list.
         */
        const [publishedResponse] = await reader.listCategories();
        expect(publishedResponse.data.listCategories.data).toHaveLength(0);
        expect(publishedResponse.data.listCategories.error).toBeNull();
    });
});
