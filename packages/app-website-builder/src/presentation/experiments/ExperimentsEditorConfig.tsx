import React from "react";
import { PageEditorConfig } from "~/presentation/pages/PageEditor/PageEditorConfig.js";
import { ExperimentsButton } from "./ExperimentsButton.js";

const { Ui } = PageEditorConfig;

/** Registers the Experiments button into the page editor top bar. */
export const ExperimentsEditorConfig = () => {
    return (
        <PageEditorConfig>
            <Ui.TopBar.Action name={"experiments"} element={<ExperimentsButton />} />
        </PageEditorConfig>
    );
};
