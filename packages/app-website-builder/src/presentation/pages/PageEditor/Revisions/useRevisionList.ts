import { useEffect, useMemo } from "react";
import { useFeature } from "@webiny/app";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { RevisionListFeature } from "~/presentation/pages/RevisionList/feature.js";

/**
 * Returns the revision list presenter, initialized for the entry the given page revision belongs
 * to. Components reading `presenter.vm` must be wrapped in `observer` to pick up cache changes.
 */
export const useRevisionList = (pageId: string) => {
    const { presenter } = useFeature(RevisionListFeature);

    const { id: entryId } = useMemo(() => parseIdentifier(pageId), [pageId]);

    useEffect(() => {
        presenter.init({ entryId });
    }, [entryId, presenter]);

    return { presenter };
};
