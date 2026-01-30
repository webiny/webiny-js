import { ModelFactory } from "webiny/api/cms/model";

export const PRODUCT_CATEGORY_MODEL_ID = "productCategory";

class ProductCategoryModelImpl implements ModelFactory.Interface {
    execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public()
                .modelId(PRODUCT_CATEGORY_MODEL_ID)
                .name("Product Category")
                .description("Product categories for organizing products")
                .group("ungrouped")
                .fields(fields => ({
                    name: fields
                        .text()
                        .renderer("text-input")
                        .label("Name")
                        .helpText("Name of the product category")
                        .required("Name is required")
                        .minLength(2)
                        .maxLength(100),
                    slug: fields
                        .text()
                        .renderer("text-input")
                        .label("Slug")
                        .helpText("URL-friendly identifier")
                        .required("Slug is required")
                        .unique(),
                    description: fields
                        .longText()
                        .renderer("long-text-text-area")
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
