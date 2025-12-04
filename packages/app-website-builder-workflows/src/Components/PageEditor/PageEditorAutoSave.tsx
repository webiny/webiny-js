import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";

const { Ui } = PageEditorConfig;

export const PageEditorAutoSave = () => {
    return <Ui.TopBar.Element remove={true} name={"autoSave"} />;
};
