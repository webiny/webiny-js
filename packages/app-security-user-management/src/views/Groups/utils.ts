import { pick } from "lodash";

export const pickDataForAPI = data => ({
    ...pick(data, ["name", "slug", "description", "permissions"])
});
