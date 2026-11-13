import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { AssistantPageContextFeature } from "./feature.js";
import type { AssistantPageContext } from "./abstractions.js";

/**
 * Tells the assistant what this view shows, for as long as the view is mounted. Pass null when there
 * is nothing worth saying yet, such as while the view loads.
 *
 * Re-set only when the content changes, compared as JSON, so a view can pass a fresh object on every
 * render.
 */
export const useAssistantPageContext = (context: AssistantPageContext.Data | null): void => {
    const { pageContext } = useFeature(AssistantPageContextFeature);
    const serialized = context ? JSON.stringify(context) : null;

    useEffect(() => {
        if (!serialized) {
            return;
        }

        const owner = pageContext.set(JSON.parse(serialized));
        return () => {
            pageContext.clear(owner);
        };
    }, [pageContext, serialized]);
};
