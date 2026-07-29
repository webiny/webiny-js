import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchOperatorList } from "./CmsEntryOpenSearchOperatorListImpl.js";

export const CmsEntryOpenSearchOperatorListFeature = createFeature({
    name: "Cms/Entry/OpenSearch/OperatorListFeature",
    register: container => {
        container.register(CmsEntryOpenSearchOperatorList);
    }
});
