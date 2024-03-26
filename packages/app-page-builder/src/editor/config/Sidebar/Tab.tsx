import React from "react";
import styled from "@emotion/styled";
import { Tab as UiTab } from "@webiny/ui/Tabs";

export const TabContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 65px - 48px)", // Subtract top-bar and tab-header height
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 1
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "darkgrey",
        outline: "1px solid slategrey"
    }
});

export interface TabProps {
    label: string;
    element: JSX.Element;
    disabled?: boolean;
    visible?: boolean;
}

export const Tab = ({ label, disabled, element, visible }: TabProps) => {
    return (
        <UiTab label={label} disabled={disabled} visible={visible}>
            <TabContainer>{element}</TabContainer>
        </UiTab>
    );
};
