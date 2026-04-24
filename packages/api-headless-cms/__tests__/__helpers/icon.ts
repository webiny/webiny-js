import type { CmsIcon } from "~/types/index.js";

export const createIcon = (name = "fa/fas"): CmsIcon => ({
    type: "icon",
    name
});
