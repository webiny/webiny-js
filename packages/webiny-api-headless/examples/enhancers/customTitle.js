export default {
    name: "cms-headless-model-field-case-title",
    type: "cms-headless-model-field",
    modelId: "product",
    fieldId: "customTitle",
    read: {
        createTypeField() {
            return "customTitle(upper: Boolean): String";
        },
        createResolver() {
            return async (entry, args, { typeValues }) => {
                // Create title cache key
                const titleCache = `product:${entry._id}:title`;

                // Get resolved `title` value
                const title = await typeValues.get(titleCache);

                // Format value according to argument
                return args.upper ? title.toUpperCase() : title.toLowerCase();
            };
        }
    }
};
