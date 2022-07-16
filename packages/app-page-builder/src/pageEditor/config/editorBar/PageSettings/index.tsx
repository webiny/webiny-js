import React from "react";
import { PageSettingsOverlay } from "./PageSettings";
import { AddPageSettingsButton } from "./PageSettingsButton";

export const PageSettingsPlugin = () => {
    return (
        <>
            <PageSettingsOverlay />
            <AddPageSettingsButton />
        </>
    );
};
