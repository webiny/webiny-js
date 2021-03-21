import pick from "lodash/pick";

export const pickDataForAPI = data => ({
    ...pick(data, ["name", "description", "permissions"])
});
