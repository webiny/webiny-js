import pick from "lodash/pick.js";
import type { ApiKey } from "~/types.js";

export const pickDataForCreate = (
    data: ApiKey
): Pick<ApiKey, "name" | "slug" | "description" | "permissions"> => {
    return structuredClone(pick(data, ["name", "slug", "description", "permissions"]));
};

export const pickDataForUpdate = (
    data: ApiKey
): Pick<ApiKey, "name" | "description" | "permissions"> => {
    return structuredClone(pick(data, ["name", "description", "permissions"]));
};
