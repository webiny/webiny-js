export default {
    name: "cms-headless-model-product-stats",
    type: "cms-headless-model-field",
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
