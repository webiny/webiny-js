import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { CmsEntryReviewNamespace } from "./abstractions.js";

/** Public CMS models review under `cms.<modelId>`; private models are left to their app (R51). */
class CmsModelReviewNamespaceImpl implements CmsEntryReviewNamespace.Interface {
    public resolve(model: CmsModel): string | null {
        return getCmsNamespace(model);
    }
}

export const CmsModelReviewNamespace = CmsEntryReviewNamespace.createImplementation({
    implementation: CmsModelReviewNamespaceImpl,
    dependencies: []
});
