import { createFeature } from "@webiny/feature/api";
import { SortMapper } from "./SortMapper.js";

export type {
    ICmsSortMapperParams,
    ICmsSortMapper
} from "./abstractions.js";

export { CmsSortMapper } from "./abstractions.js";

export const CmsSortMapperFeature = createFeature({
    name: "CmsSortMapper",
    register(container) {
        container.register(SortMapper).inSingletonScope();
    }
});
