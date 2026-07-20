import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchOperatorListImpl } from "./CmsEntryOpenSearchOperatorListImpl.js";

export const CmsEntryOpenSearchOperatorListFeature = createFeature({
    name: "Cms/Entry/OpenSearch/OperatorListFeature",
    register: container => {
        container.register(CmsEntryOpenSearchOperatorListImpl);
    }
});
