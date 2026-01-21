import { createFeature } from "@webiny/feature/api";
import { WhereMapper } from "./WhereMapper.js";

export type {
    ICmsFieldInputToWhereMapperParams,
    ICmsFieldInputToWhereMapper
} from "./abstractions.js";

export { CmsFieldInputToWhereMapper } from "./abstractions.js";

export const CmsFieldInputToWhereMapperFeature = createFeature({
    name: "CmsFieldInputToWhereMapper",
    register(container) {
        container.register(WhereMapper).inSingletonScope();
    }
});
