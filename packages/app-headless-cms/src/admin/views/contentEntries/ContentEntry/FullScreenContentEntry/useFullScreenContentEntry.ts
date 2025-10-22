import { createGenericContext } from "@webiny/app";

export interface FullScreenContentEntryContext {
    isRevisionListOpen: boolean;
    openRevisionList: (open: boolean) => void;
    isCompareRevisionsOpen: boolean;
    openCompareRevisions: (open: boolean) => void;
}

const { Provider, useHook } = createGenericContext<FullScreenContentEntryContext>(
    "FullScreenContentEntryContext"
);

export const useFullScreenContentEntry = useHook;
export const FullScreenContentEntryProvider = Provider;
