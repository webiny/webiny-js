import { ModelFactory } from "webiny/api/cms/model";

export const PRODUCT_CATEGORY_MODEL_ID = "productCategory";

class ProductCategoryModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: PRODUCT_CATEGORY_MODEL_ID,
                    name: "Product Category",
                    group: "hidden"
                })
                .description("Product categories for organizing products")
                .group("ungrouped")
                .fields(fields => ({
                    name: fields
                        .text()
                        .renderer("textInput")
                        .label("Name")
                        .description("Name of the product category")
                        .required("Name is required")
                        .minLength(2)
                        .maxLength(100),
                    slug: fields
                        .text()
                        .renderer("textInput")
                        .label("Slug")
                        .description("URL-friendly identifier")
                        .required("Slug is required")
                        .unique(),
                    description: fields
                        .longText()
                        .renderer("textarea")
                        .label("Description")
                        .minLength(10)
                }))
                .layout([["name", "slug"], ["description"]])
                .titleFieldId("name")
                .singularApiName("ProductCategory")
                .pluralApiName("ProductCategories")
        ];
    }
}

export const ProductCategoryModel = ModelFactory.createImplementation({
    implementation: ProductCategoryModelImpl,
    dependencies: []
});
