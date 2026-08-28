import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { CollaborationApiFeature } from "~/features/api/feature.js";
import { CommentsPresenterFeature } from "~/presentation/comments/feature.js";
import { CommentsHeaderButton } from "~/cms/CommentsHeaderButton.js";
import { CommentsSidePanelDecorator } from "~/cms/CommentsSidePanelDecorator.js";
import { FieldMarkerDecorator } from "~/cms/FieldMarkerDecorator.js";

/**
 * Mount once in the admin app. Registers the collaboration data-access + presenter features and
 * injects the Comments header toggle + side panel into the Headless CMS entry editor.
 *
 * TODO(before release): collaboration ships in the APW tier — re-wrap in
 * <Wcp.CanUseWorkflows> (or the appropriate capability gate). Ungated for now so it works
 * without a workflows license during development.
 */
export const CollaborationAdminApp = () => {
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
