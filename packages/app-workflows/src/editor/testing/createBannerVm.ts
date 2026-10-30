import type { OptionsBannerVm } from "~/editor/presentation/editor/abstractions.js";
import type { SaveBannerKind } from "~/editor/presentation/editor/abstractions.js";
import type { SaveBannerVm } from "~/editor/presentation/editor/abstractions.js";

const SAVE_BANNERS: Record<SaveBannerKind, SaveBannerVm> = {
    duplicate: {
        kind: "duplicate",
        title: null,
        message:
            "Could not save the workflow — Article already has a workflow: “Article approval”. A model can have one workflow.",
        canReload: true,
        canRetry: false,
        dismissible: false
    },
    message: {
        kind: "message",
        title: null,
        message: "Could not save the workflow — Add at least one step.",
        canReload: false,
        canRetry: false,
        dismissible: false
    },
    transport: {
        kind: "transport",
        title: "Could not save the workflow",
        message: "The server did not respond, so nothing was saved. Your changes are kept.",
        canReload: false,
        canRetry: true,
        dismissible: true
    }
};

// The save banner of a kind with the design's copy; `overrides` changes single fields.
export const createSaveBannerVm = (
    kind: SaveBannerKind,
    overrides: Partial<SaveBannerVm> = {}
): SaveBannerVm => {
    return { ...SAVE_BANNERS[kind], ...overrides };
};

export const createOptionsBannerVm = (): OptionsBannerVm => {
    return { message: "Could not load the step options." };
};
