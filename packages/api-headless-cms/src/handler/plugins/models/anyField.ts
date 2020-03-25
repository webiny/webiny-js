import { createField } from "@commodo/fields";

export const any = (options = {}) => {
    return createField({ ...options, type: "any" });
};
