import get from "lodash/get";

export const getOptions = (list, extraOptions = null) => {
    return get(list, "data.content.data", [])
        .map(item => {
            const name = item.meta.title;

            if (!name) {
                return null;
            }

            const extraData = typeof extraOptions === "function" ? extraOptions(item) : {};

            return {
                id: item.id,
                name: name,
                ...extraData
            };
        })
        .filter(Boolean);
};
