import React from "react";
import { EditorConfig } from "~/BaseEditor/index.js";
import { Breadcrumbs } from "./Breadcrumbs/index.js";
import { DocumentPreview } from "./Preview/DocumentPreview.js";
import { AddressBar } from "./AddressBar/AddressBar.js";
import { BreakpointSelector } from "./AddressBar/BreakpointSelector.js";
import { SampleFrontendBanner } from "./SampleFrontendBanner.js";

export const ContentPreviewConfig = () => {
    const { Ui } = EditorConfig;

    return (
        <>
            <Ui.TopBar.Element
                name={"breakpointSelector"}
                group={"center"}
                element={<BreakpointSelector />}
            />
            <Ui.Content.Element name="addressBar" element={<AddressBar />} />
            <Ui.Content.Element
                name="sampleFrontendBanner"
                after="addressBar"
                element={<SampleFrontendBanner />}
            />
            <Ui.Content.Element name="iframe" element={<DocumentPreview />} />
            <Ui.Content.Element
                name={"breadcrumbs"}
                element={
                    <Ui.IsNotReadOnly>
                        <Breadcrumbs />
                    </Ui.IsNotReadOnly>
                }
            />
        </>
    );
};
