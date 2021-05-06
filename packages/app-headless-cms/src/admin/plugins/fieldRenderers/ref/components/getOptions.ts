export const getOptions = (entries = [], extraOptions = null) => {
    return entries
        .map(item => {
            const name = item.title;

            if (!name) {
                return null;
            }

            const extraData = typeof extraOptions === "function" ? extraOptions(item) : {};

            return {
                id: item.id,
                modelId: item.model.modelId,
                modelName: item.model.name,
                name: name,
                published: item.status === "published",
                ...extraData
            };
        })
        .filter(Boolean);
};
