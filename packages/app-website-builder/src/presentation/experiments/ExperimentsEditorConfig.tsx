import React from "react";
import { PageEditorConfig } from "~/presentation/pages/PageEditor/PageEditorConfig.js";
import { ExperimentsButton } from "./ExperimentsButton.js";
import { ExperimentPreviewToolbar } from "./ExperimentPreviewToolbar.js";
import { ExperimentsEditorProvider } from "./ExperimentsEditorContext.js";

const { Ui } = PageEditorConfig;

/** Wraps the whole editor so the top-bar switcher and the in-preview toolbar share selection state. */
const ExperimentsLayoutDecorator = Ui.Layout.createDecorator(Original => {
    return function ExperimentsEditorLayout() {
        return (
            <ExperimentsEditorProvider>
                <Original />
            </ExperimentsEditorProvider>
        );
    };
});

/** Registers the Experiments button (top bar) and the in-preview experiment toolbar. */
export const ExperimentsEditorConfig = () => {
    return (
        <PageEditorConfig>
            <ExperimentsLayoutDecorator />
            <Ui.TopBar.Action
                name={"experiments"}
                before={"buttonPublish"}
                element={<ExperimentsButton />}
            />
            <Ui.Content.Element
                name={"experimentToolbar"}
                after={"addressBar"}
                element={<ExperimentPreviewToolbar />}
            />
        </PageEditorConfig>
    );
};
