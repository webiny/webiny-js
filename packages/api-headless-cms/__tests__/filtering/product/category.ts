import { CategoryManager, ProductCategory } from "../../types";

export const createCategoryFactory = (manager: CategoryManager) => {
    return async (): Promise<ProductCategory> => {
        const [createCategoryResponse] = await manager.createCategory({
            data: {
                title: "Items",
                slug: "items"
            }
        });
        return createCategoryResponse.data.createCategory.data as ProductCategory;
    };
};
