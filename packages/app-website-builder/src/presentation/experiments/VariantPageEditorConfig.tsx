import React from "react";
import { InternalPageEditorConfig } from "~/presentation/pages/PageEditor/PageEditorConfig.js";
import { BackButton } from "~/presentation/pages/PageEditor/TopBar/BackButton.js";
import { Title } from "~/presentation/pages/PageEditor/TopBar/Title.js";
import { TopBarOptionsMenu } from "~/BaseEditor/config/TopBar/Layout.js";
import { VariantAutoSave } from "./VariantAutoSave.js";

const { Ui } = InternalPageEditorConfig;

/**
 * Editor config used when a variant is the edited document. It reuses the page editor scope (so the
 * experiments switcher/toolbar still render) but swaps page-only chrome — publish, revisions,
 * settings — for a variant-scoped autosave.
 */
export const VariantPageEditorConfig = () => {
    return (
        <InternalPageEditorConfig>
            <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
            <Ui.TopBar.Element name={"title"} group={"left"} element={<Title />} />
            <Ui.TopBar.Action name={"optionsMenu"} element={<TopBarOptionsMenu />} />
            <Ui.TopBar.Element group={"left"} name={"autoSave"} element={<VariantAutoSave />} />
        </InternalPageEditorConfig>
    );
};
