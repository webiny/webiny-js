import { createFeature } from "@webiny/feature/api";
import { WhereMapper } from "./WhereMapper.js";

export type { ICmsWhereMapperParams, ICmsWhereMapper } from "./abstractions.js";

export { CmsWhereMapper } from "./abstractions.js";

export const CmsWhereMapperFeature = createFeature({
    name: "CmsWhereMapper",
    register(container) {
        container.register(WhereMapper).inSingletonScope();
    }
});
