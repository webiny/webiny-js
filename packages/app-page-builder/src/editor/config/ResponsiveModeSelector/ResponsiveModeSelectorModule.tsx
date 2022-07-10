import React from "react";
import { Compose, HigherOrderComponent } from "@webiny/app-admin";
import { EditorBar } from "~/editor";
import { ResponsiveModeSelector } from "./ResponsiveModeSelector";

const AddResponsiveModeSelector: HigherOrderComponent = CenterSection => {
    return function AddResponsiveModeSelector(props) {
        return (
            <CenterSection>
                {props.children}
                <ResponsiveModeSelector />
            </CenterSection>
        );
    };
};

export const ResponsiveModeSelectorModule = React.memo(() => {
    return <Compose component={EditorBar.CenterSection} with={AddResponsiveModeSelector} />;
});

ResponsiveModeSelectorModule.displayName = "ResponsiveModeSelectorModule";
