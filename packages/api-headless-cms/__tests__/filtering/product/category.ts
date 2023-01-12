import { CategoryManager, ProductCategory } from "../../types";

export const createCategoryFactory = (manager: CategoryManager) => {
    return async (): Promise<ProductCategory> => {
        const [createCategoryResponse] = await manager.createCategory({
            data: {
                title: "Items",
                slug: "items"
            }
        });
        const category = createCategoryResponse.data.createCategory.data as ProductCategory;

        await manager.until(
            () => manager.listCategories().then(([data]) => data),
            ({ data }: any) => {
                return data.listCategories.data[0].id === category.id;
            },
            { name: "make sure category exists" }
        );
        return category;
    };
};
