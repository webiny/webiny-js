import React from "react";
import styled from "@emotion/styled";
import { Toolbar } from "./Toolbar";
import { Tabs } from "@webiny/admin-ui/Tabs";

const ToolbarContainer = styled("div")({
    display: "block",
    width: 300,
    height: "100%",
    backgroundColor: "var(--mdc-theme-surface)",
    borderRight: "1px solid var(--mdc-theme-on-background)"
});

export const Layout = () => {
    return (
        <ToolbarContainer data-role={"toolbar-layout"}>
            <Tabs
                size="md"
                spacing={"md"}
                defaultValue={"insert"}
                tabs={[<Toolbar.Elements key="tabs" group={"tabs"} />]}
                separator={true}
            />
        </ToolbarContainer>
    );
};
