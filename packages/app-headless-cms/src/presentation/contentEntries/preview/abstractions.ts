import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefValuesMap } from "./resolvePreviewUrl.js";

export interface PreviewComponent {
    name: string;
    label: string;
    description: string;
}

export interface ILivePreviewPresenter {
    vm: {
        components: PreviewComponent[];
        refValues: RefValuesMap;
    };
    addComponent(component: PreviewComponent): void;
    clearComponents(): void;
    /**
     * Loads referenced entries that the preview path reads through, e.g. `{values.location.slug}`.
     * Each ref is requested once; results land in `vm.refValues`.
     */
    loadRefValues(refs: CmsReferenceValue[]): void;
}

export const LivePreviewPresenter = createAbstraction<ILivePreviewPresenter>(
    "CmsContentEntries/LivePreviewPresenter"
);

export namespace LivePreviewPresenter {
    export type Interface = ILivePreviewPresenter;
}
