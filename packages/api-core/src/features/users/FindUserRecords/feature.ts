import { createFeature } from "@webiny/feature/api";
import { FindUserRecordsUseCase } from "./FindUserRecordsUseCase.js";

export const FindUserRecordsFeature = createFeature({
    name: "FindUserRecords",
    register(container) {
        container.register(FindUserRecordsUseCase);
    }
});
