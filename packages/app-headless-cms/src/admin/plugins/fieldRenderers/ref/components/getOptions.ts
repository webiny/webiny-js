export const getOptions = (entries = [], extraOptions = null) => {
    return entries
        .map(item => {
            const name = item.meta.title;

            if (!name) {
                return null;
            }

            const extraData = typeof extraOptions === "function" ? extraOptions(item) : {};

            return {
                id: item.id,
                name: name,
                published: item.meta.status === "published",
                ...extraData
            };
        })
        .filter(Boolean);
};
