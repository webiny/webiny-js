import { createGenericContext } from "@webiny/app";
import type { CmsContentEntryRevision } from "~/types.js";

export interface CompareEntryRevisionsContext {
    selectedRevisions: CmsContentEntryRevision[];
    setSelectedRevisions: (revisions: CmsContentEntryRevision[]) => void;
    isComparisonDialogOpen: boolean;
    openComparisonDialog: (open: boolean) => void;
    canCompare: boolean;
}

const { Provider, useHook } = createGenericContext<CompareEntryRevisionsContext>(
    "CompareEntryRevisionsContext"
);

export const useCompareEntryRevisions = useHook;
export const CompareEntryRevisionsProvider = Provider;
