import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { CmsCompareEntryRevisionsPresentationFeature } from "./feature.js";
import { CmsCompareEntryRevisionsMenuItem } from "./CmsCompareEntryRevisionsMenuItem.js";
import { CmsCompareEntryRevisionsOverlays } from "./CmsCompareEntryRevisionsOverlays.js";

const { Actions } = InternalContentEntryEditorConfig;

export const CmsCompareEntryRevisions = () => {
    return (
        <>
            <RegisterFeature feature={CmsCompareEntryRevisionsPresentationFeature} />
            <InternalContentEntryEditorConfig>
                {/* Revisions exist only on publishable models (an untagged singleton has only #0001). */}
                <IsModelPublishable>
                    <Actions.MenuItemAction
                        name={"compareEntryRevisions"}
                        element={<CmsCompareEntryRevisionsMenuItem />}
                    />
                </IsModelPublishable>
            </InternalContentEntryEditorConfig>
            <CmsCompareEntryRevisionsOverlays />
        </>
    );
};
