import React from "react";
import { InternalPageEditorConfig } from "~/presentation/pages/PageEditor/PageEditorConfig.js";
import { VariantBackButton } from "./VariantBackButton.js";
import { VariantTitle } from "./VariantTitle.js";
import { VariantAutoSave } from "./VariantAutoSave.js";

const { Ui } = InternalPageEditorConfig;

interface Props {
    variantName: string;
}

/**
 * Top bar for the variant editor. Reuses the base editor config primitives but wires the
 * variant autosave (updateVariant) instead of the page autosave/publish controls.
 */
export const VariantEditorConfig = ({ variantName }: Props) => {
    return (
        <InternalPageEditorConfig>
            <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<VariantBackButton />} />
            <Ui.TopBar.Element
                name={"title"}
                group={"left"}
                element={<VariantTitle name={variantName} />}
            />
            <Ui.TopBar.Element name={"autoSave"} group={"left"} element={<VariantAutoSave />} />
        </InternalPageEditorConfig>
    );
};
