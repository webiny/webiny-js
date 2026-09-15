import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { CollaborationApiFeature } from "./features/api/feature.js";
import { CommentsPresenterFeature } from "./presentation/comments/feature.js";
import { CommentsHeaderButton } from "./cms/CommentsHeaderButton.js";
import { CommentsSidePanelDecorator } from "./cms/CommentsSidePanelDecorator.js";
import { FieldMarkerDecorator } from "./cms/FieldMarkerDecorator.js";

export const Extension = () => {
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
