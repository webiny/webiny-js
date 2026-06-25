import { createFeature } from "@webiny/feature/api";
import { FilterUtil } from "./FilterUtil.js";

export const FilterUtilFeature = createFeature({
    name: "Db/DynamoDB/FilterUtilFeature",
    register: container => {
        container.register(FilterUtil);
    }
});
