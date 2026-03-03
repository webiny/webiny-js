import React from "react";
import styled from "@emotion/styled";
import { Tabs } from "@webiny/admin-ui";

export const TabContainer = styled("div")({
    display: "flex",
    position: "relative",
    flexDirection: "column",
    height: "calc(100vh - 44px - 49px)", // Subtract top-bar and tab-header height
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
    name: string;
    label: string;
    noPadding?: boolean;
    element: React.JSX.Element;
    disabled?: boolean;
    visible?: boolean;
}

export const Tab = ({ name, label, disabled, element, visible, noPadding }: TabProps) => {
    return (
        <Tabs.Tab
            className={noPadding ? "p-0" : undefined}
            value={name}
            trigger={label}
            disabled={disabled}
            visible={visible}
            content={<TabContainer>{element}</TabContainer>}
        />
    );
};
