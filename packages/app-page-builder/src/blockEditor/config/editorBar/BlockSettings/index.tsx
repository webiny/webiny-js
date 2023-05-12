import React from "react";
import { BlockSettingsOverlay } from "./BlockSettings";
import { AddBlockSettingsButton } from "./BlockSettingsButton";

export const BlockSettingsPlugin = () => {
    return (
        <>
            <BlockSettingsOverlay />
            <AddBlockSettingsButton />
        </>
    );
};
