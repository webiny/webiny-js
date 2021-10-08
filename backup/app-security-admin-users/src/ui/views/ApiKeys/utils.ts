import { pick } from "lodash";

export const pickDataForAPI = data => ({
    ...pick(data, ["name", "description", "permissions"])
});
