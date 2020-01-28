export default {
    name: "cms--model-product-stats",
    type: "cms--model-field",
    modelId: "product",
    fieldId: "stats",
    read: {
        createTypes() {
            return `
                type ProductStats {
                    views: Int
                    clicks: Int
                }
              `;
        },
        createTypeField() {
            return "stats: ProductStats";
        },
        createResolver() {
            return async () => {
                return {
                    views: 34,
                    clicks: 23
                };
            };
        }
    }
};
