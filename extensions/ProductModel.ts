import { ModelFactory } from "webiny/api/cms/model";

export const PRODUCT_MODEL_ID = "product";

class ProductModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public()
                .modelId(PRODUCT_MODEL_ID)
                .name("Product")
                .description("Products for our e-commerce store")
                .group("ungrouped")
                .fields(fields => ({
                    name: fields
                        .text()
                        .renderer("textInput")
                        .label("Name")
                        .helpText("Product name")
                        .required("Name is required"),
                    sku: fields
                        .text()
                        .renderer("textInput")
                        .label("SKU")
                        .helpText("Stock Keeping Unit - unique product identifier")
                        .required("SKU is required")
                        .unique(),
                    description: fields
                        .longText()
                        .renderer("textarea")
                        .label("Description")
                        .helpText("Detailed product description"),
                    price: fields
                        .number()
                        .renderer("numberInput")
                        .label("Price")
                        .required("Price is required")
                        .gte(0, "Price must be greater than or equal to 0"),
                    category: fields
                        .ref()
                        .renderer("refDialogSingle")
                        .label("Category")
                        .models([{ modelId: "productCategory" }])
                }))
                .layout([["name"], ["sku"], ["category"], ["description"], ["price"]])
                .titleFieldId("name")
                .singularApiName("Product")
                .pluralApiName("Products")
        ];
    }
}

export const ProductModel = ModelFactory.createImplementation({
    implementation: ProductModelImpl,
    dependencies: []
});
