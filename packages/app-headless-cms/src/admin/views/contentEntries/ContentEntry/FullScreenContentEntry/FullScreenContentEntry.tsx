import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";
import { RevisionListDrawer } from "./RevisionListDrawer/index.js";
import { CompareRevisionsDrawer } from "~/admin/views/contentEntries/CompareEntryRevisions/CompareRevisionsDrawer.js";

import { FullScreenContentEntryHeaderLeft } from "./FullScreenContentEntryHeaderLeft.js";
import * as FSE from "./FullScreenContentEntry.styled.js";
import { FullScreenContentEntryProvider } from "./useFullScreenContentEntry.js";
import { ContentEntryEditorConfig } from "~/ContentEntryEditorConfig.js";
import { cmsLegacyEntryEditor } from "~/utils/cmsLegacyEntryEditor.js";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { HeaderBar, OverlayLoader } from "@webiny/admin-ui";

const { ContentEntry } = ContentEntryEditorConfig;

const FullScreenContentEntryDecorator = ContentEntry.createDecorator(Original => {
    return function ContentEntry() {
        const { width } = useContentEntryEditorConfig();
        const { loading } = useContentEntry();
        const [isRevisionListOpen, openRevisionList] = useState<boolean>(false);
        const [isCompareRevisionsOpen, openCompareRevisions] = useState<boolean>(false);

        return (
            <FullScreenContentEntryProvider
                openRevisionList={openRevisionList}
                isRevisionListOpen={isRevisionListOpen}
                openCompareRevisions={openCompareRevisions}
                isCompareRevisionsOpen={isCompareRevisionsOpen}
            >
                <FSE.Container>
                    <HeaderBar
                        start={<FullScreenContentEntryHeaderLeft />}
                        end={
                            <div
                                // Empty div to relocate Entry Form Header via React Portal in full-screen mode.
                                // Ensures layout flexibility without disrupting React context and state.
                                id={"cms-content-entry-header-right"}
                            />
                        }
                    />
                    {loading && <OverlayLoader text={"Loading entry..."} className={"wby-z-10"} />}
                    <FSE.Content>
                        <FSE.ContentFormWrapper>
                            <FSE.ContentFormInner width={width}>
                                {loading ? null : <Original />}
                            </FSE.ContentFormInner>
                        </FSE.ContentFormWrapper>
                    </FSE.Content>
                    <RevisionListDrawer />
                    <CompareRevisionsDrawer />
                </FSE.Container>
            </FullScreenContentEntryProvider>
        );
    };
});

const FullScreenContentEntryFormDecorator = ContentEntry.ContentEntryForm.createDecorator(
    Original => {
        return function ContentEntryForm(props) {
            return <Original {...props} className={"wby-h-full"} />;
        };
    }
);

const FullScreenContentEntryFormHeaderDecorator =
    ContentEntry.ContentEntryForm.Header.createDecorator(Original => {
        return function ContentEntryFormHeader() {
            const headerRightElement = document.getElementById("cms-content-entry-header-right");

            if (!headerRightElement) {
                return <Original />;
            }

            return createPortal(<Original />, headerRightElement);
        };
    });

export const FullScreenContentEntry = () => {
    if (cmsLegacyEntryEditor) {
        return null;
    }

    return (
        <>
            <FullScreenContentEntryDecorator />
            <FullScreenContentEntryFormDecorator />
            <FullScreenContentEntryFormHeaderDecorator />
        </>
    );
};
