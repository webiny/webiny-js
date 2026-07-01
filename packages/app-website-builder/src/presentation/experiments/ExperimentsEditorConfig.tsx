import React from "react";
import { PageEditorConfig } from "~/presentation/pages/PageEditor/PageEditorConfig.js";
import { ExperimentsButton } from "./ExperimentsButton.js";
import { ExperimentPreviewToolbar } from "./ExperimentPreviewToolbar.js";

const { Ui } = PageEditorConfig;

/**
 * Registers the Experiments button (top bar) and the in-preview experiment toolbar.
 *
 * The shared selection state lives in the ExperimentsEditorProvider, which PageEditor mounts around
 * the editor so it can swap the edited document between the page and a variant.
 */
export const ExperimentsEditorConfig = () => {
    return (
        <PageEditorConfig>
            {/* Draft page: the switcher, before the Publish button. */}
            <Ui.IsNotReadOnly>
                <Ui.TopBar.Action
                    name={"experiments"}
                    before={"buttonPublish"}
                    element={<ExperimentsButton />}
                />
            </Ui.IsNotReadOnly>
            {/* Published page: the running-experiment indicator + kill-switch, before the version menu. */}
            <Ui.IsReadOnly>
                <Ui.TopBar.Action
                    name={"experimentsStatus"}
                    before={"revisionsMenu"}
                    element={<ExperimentsButton />}
                />
            </Ui.IsReadOnly>
            <Ui.Content.Element
                name={"experimentToolbar"}
                after={"addressBar"}
                element={<ExperimentPreviewToolbar />}
            />
        </PageEditorConfig>
    );
};
