import React from "react";
import { RegisterFeature } from "webiny/admin";
import { ContentEntryEditorConfig } from "webiny/admin/cms/entry/editor";
import { CompareRevisionsGatewayFeature } from "./features/compareRevisions/feature.js";
import { CompareRevisionsPresentationFeature } from "./presentation/compareRevisions/feature.js";
import { CompareRevisionsMenuItem } from "./presentation/compareRevisions/components/CompareRevisionsMenuItem.js";
import { CompareRevisionsOverlays } from "./presentation/compareRevisions/components/CompareRevisionsOverlays.js";

export default () => (
    <>
        <RegisterFeature feature={CompareRevisionsGatewayFeature} />
        <RegisterFeature feature={CompareRevisionsPresentationFeature} />
        <ContentEntryEditorConfig>
            <ContentEntryEditorConfig.Actions.MenuItemAction
                name={"compareRevisions"}
                element={<CompareRevisionsMenuItem />}
            />
        </ContentEntryEditorConfig>
        <CompareRevisionsOverlays />
    </>
);
