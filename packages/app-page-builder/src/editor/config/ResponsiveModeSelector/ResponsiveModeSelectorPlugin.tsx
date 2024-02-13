import React from "react";
import { createDecorator } from "@webiny/app-admin";
import { EditorBar } from "~/editor";
import { ResponsiveModeSelector } from "./ResponsiveModeSelector";

export const ResponsiveModeSelectorPlugin = createDecorator(
    EditorBar.CenterSection,
    CenterSection => {
        return function AddResponsiveModeSelector(props) {
            return (
                <CenterSection>
                    {props.children}
                    <ResponsiveModeSelector />
                </CenterSection>
            );
        };
    }
);
