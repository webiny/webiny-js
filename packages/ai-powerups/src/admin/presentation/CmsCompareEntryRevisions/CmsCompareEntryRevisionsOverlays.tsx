import React from "react";
import { useFeature } from "@webiny/app";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CmsCompareEntryRevisionsPresentationFeature } from "./feature.js";
import { CmsCompareEntryRevisionsDrawer } from "./CmsCompareEntryRevisionsDrawer.js";
import { CmsCompareEntryRevisionsDialog } from "./CmsCompareEntryRevisionsDialog.js";

export const CmsCompareEntryRevisionsOverlays = ContentEntryFormContent.createDecorator(
    Original => {
        return function ContentEntryFormContentWithCompareRevisions(props) {
            const { presenter } = useFeature(CmsCompareEntryRevisionsPresentationFeature);

            return (
                <>
                    <Original {...props} />
                    <CmsCompareEntryRevisionsDrawer presenter={presenter} />
                    <CmsCompareEntryRevisionsDialog presenter={presenter} />
                </>
            );
        };
    }
);
