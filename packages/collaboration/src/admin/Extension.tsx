import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { CollaborationApiFeature } from "./features/api/feature.js";
import { CommentsPresenterFeature } from "./presentation/comments/feature.js";
import { CommentsHeaderButton } from "./cms/CommentsHeaderButton.js";
import { CommentsSidePanelDecorator } from "./cms/CommentsSidePanelDecorator.js";
import { FieldMarkerDecorator } from "./cms/FieldMarkerDecorator.js";

export const Extension = () => {
    const featureFlags = useFeatureFlags();

    /*
     * Mirrors the API gate, so an unlicensed project has no comments button or side panel. The
     * effective flags already combine the licence with the project's own feature flags, the same
     * check `WcpContext.canUseComments()` makes on the API.
     */
    if (!featureFlags.isEnabled("collaboration.comments")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={CollaborationApiFeature} />
            <RegisterFeature feature={CommentsPresenterFeature} />
            <CommentsHeaderButton />
            <CommentsSidePanelDecorator />
            <FieldMarkerDecorator />
        </>
    );
};
