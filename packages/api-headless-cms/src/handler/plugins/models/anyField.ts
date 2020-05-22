import { createField } from "@webiny/commodo";

export const any = (options = {}) => {
    return createField({ ...options, type: "any" });
};
