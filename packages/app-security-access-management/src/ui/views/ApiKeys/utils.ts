import pick from "lodash/pick";
import { ApiKey } from "~/types";

export const pickDataForAPI = (
    data: ApiKey
): Pick<ApiKey, "name" | "description" | "permissions"> => ({
    ...pick(data, ["name", "description", "permissions"])
});
