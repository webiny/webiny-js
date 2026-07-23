import React from "react";
import { useFeature } from "webiny/admin";
import { ContentEntryFormContent } from "webiny/admin/cms/entry/editor";
import { CompareRevisionsPresentationFeature } from "../feature.js";
import { CompareRevisionsDrawer } from "./CompareRevisionsDrawer.js";
import { CompareRevisionsDialog } from "./CompareRevisionsDialog.js";

export const CompareRevisionsOverlays = ContentEntryFormContent.createDecorator(Original => {
    return function ContentEntryFormContentWithCompareRevisions(props) {
        const { presenter } = useFeature(CompareRevisionsPresentationFeature);

        return (
            <>
                <Original {...props} />
                <CompareRevisionsDrawer presenter={presenter} />
                <CompareRevisionsDialog presenter={presenter} />
            </>
        );
    };
});
