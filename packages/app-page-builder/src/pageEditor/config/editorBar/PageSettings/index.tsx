import React from "react";
import { Compose } from "@webiny/app-admin/";
import { EditorBar } from "~/editor";
import { PageSettingsOverlay } from "./PageSettings";
import { AddPageSettingsButton } from "./PageSettingsButton";

export const PageSettingsPlugin = () => {
    return (
        <>
            <Compose component={EditorBar} with={PageSettingsOverlay} />
            <Compose component={EditorBar.RightSection} with={AddPageSettingsButton} />
        </>
    );
};
