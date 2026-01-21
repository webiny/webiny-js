import type { CategoryManager } from "../../types";

export const createCategoryFactory = (manager: CategoryManager) => {
    return async () => {
        const [createCategoryResponse] = await manager.createCategory({
            variables: {
                data: {
                    values: {
                        title: "Items",
                        slug: "items"
                    }
                }
            }
        });
        return createCategoryResponse.data.createCategory.data!;
    };
};
