import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { LayoutRevisionsFeature } from "./feature.js";

/**
 * The revisions presenter, set up for the layout open in the editor. Use it in a reactive component.
 */
export const useLayoutRevisions = () => {
    const { presenter } = useFeature(LayoutRevisionsFeature);
    const entryId = useSelectFromDocument<string, LayoutEditorDocument>(
        document => document.entryId
    );

    useEffect(() => {
        presenter.init(entryId);
    }, [presenter, entryId]);

    return presenter;
};
