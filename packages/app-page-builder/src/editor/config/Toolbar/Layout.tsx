import React from "react";
import styled from "@emotion/styled";
import { Toolbar } from "./Toolbar";
import { useDrawers } from "./DrawersProvider";
import { DrawerProvider } from "./DrawerProvider";

const ToolbarDrawerContainer = styled("div")({
    top: 64,
    left: 0,
    position: "fixed",
    backgroundColor: "var(--mdc-theme-surface)",
    zIndex: 2
});
const ToolbarContainer = styled("div")({
    position: "fixed",
    display: "inline-block",
    padding: "2px 1px 2px 3px",
    width: 50,
    top: 64,
    height: "calc(100vh - 68px)",
    backgroundColor: "var(--mdc-theme-surface)",
    boxShadow: "1px 0px 5px 0px var(--mdc-theme-on-background)",
    zIndex: 3
});

const ToolbarActions = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%"
});

export const Layout = () => {
    const { drawers } = useDrawers();

    return (
        <>
            <ToolbarDrawerContainer>
                {drawers.map(drawer => (
                    <DrawerProvider key={drawer.id} drawer={drawer}>
                        {drawer.element}
                    </DrawerProvider>
                ))}
            </ToolbarDrawerContainer>
            <ToolbarContainer>
                <ToolbarActions>
                    <div>
                        <Toolbar.Elements group={"top"} />
                    </div>
                    <div>
                        <Toolbar.Elements group={"bottom"} />
                    </div>
                </ToolbarActions>
            </ToolbarContainer>
        </>
    );
};
