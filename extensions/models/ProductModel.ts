import { ModelFactory } from "webiny/api/cms/model";

export const PRODUCT_MODEL_ID = "product";

class ProductModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: PRODUCT_MODEL_ID,
                    name: "Product",
                    group: "ungrouped"
                })
                .description("Products for our e-commerce store")
                .fields(fields => ({
                    name: fields
                        .text()
                        .renderer("textInput")
                        .label("Name")
                        .help("Product name")
                        .required("Name is required"),
                    sku: fields
                        .text()
                        .renderer("textInput")
                        .label("SKU")
                        .help("Stock Keeping Unit - unique product identifier")
                        .required("SKU is required")
                        .unique(),
                    description: fields
                        .longText()
                        .renderer("textarea")
                        .label("Description")
                        .help("Detailed product description"),
                    price: fields
                        .number()
                        .renderer("numberInput")
                        .label("Price")
                        .required("Price is required")
                        .gte(0, "Price must be greater than or equal to 0"),
                    onSale: fields
                        .boolean()
                        .renderer("switch")
                        .label("On sale")
                        .help(
                            'Set by the "Apply Discount" bulk action. Turn off to make the product eligible for a discount again.'
                        ),
                    category: fields
                        .ref()
                        .renderer("refDialogSingle")
                        .label("Category")
                        .models([{ modelId: "productCategory" }])
                }))
                .layout([["name"], ["sku"], ["category"], ["description"], ["price", "onSale"]])
                .titleFieldId("name")
                .singularApiName("Product")
                .pluralApiName("Products")
        ];
    }
}

export default ModelFactory.createImplementation({
    implementation: ProductModelImpl,
    dependencies: []
});
