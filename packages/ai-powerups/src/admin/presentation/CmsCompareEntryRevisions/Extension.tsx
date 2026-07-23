import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { CmsCompareEntryRevisionsPresentationFeature } from "./feature.js";
import { CmsCompareEntryRevisionsMenuItem } from "./CmsCompareEntryRevisionsMenuItem.js";
import { CmsCompareEntryRevisionsOverlays } from "./CmsCompareEntryRevisionsOverlays.js";

const { Actions } = InternalContentEntryEditorConfig;

export const CmsCompareEntryRevisions = () => {
    return (
        <>
            <RegisterFeature
                feature={CmsCompareEntryRevisionsPresentationFeature}
            />
            <InternalContentEntryEditorConfig>
                <Actions.MenuItemAction
                    name={"compareEntryRevisions"}
                    element={<CmsCompareEntryRevisionsMenuItem />}
                />
            </InternalContentEntryEditorConfig>
            <CmsCompareEntryRevisionsOverlays />
        </>
    );
};
