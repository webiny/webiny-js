//@flow
import React, { useEffect, useRef } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import styled from "@emotion/styled";
import { css } from "emotion";
import { isEqual } from "lodash";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { getPlugins } from "@webiny/plugins";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { deactivatePlugin } from "@webiny/app-page-builder/editor/actions";
import { getActivePlugins } from "@webiny/app-page-builder/editor/selectors";

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

const DrawerContainer = styled("div")(props => ({
    pointerEvents: props.open ? "all" : "none",
    ".mdc-drawer__drawer": {
        "> .mdc-list": {
            padding: 0
        }
    }
}));

const ToolbarActions = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%"
});

const drawerStyle = css({
    zIndex: 10,
    "&.mdc-drawer--dismissible": {
        marginLeft: 54,
        position: "fixed",
        top: 64,
        width: "490px !important",
        maxWidth: "490px !important",
        ".mdc-drawer__content": {
            width: "100%"
        }
    }
});

const ToolbarDrawer = connect(
    null,
    { deactivatePlugin }
)(({ name, active, children, deactivatePlugin }) => {
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();
    const last = useRef({ active: null });
    useEffect(() => {
        if (active && !last.current.active) {
            addKeyHandler("escape", e => {
                e.preventDefault();
                deactivatePlugin({ name });
            });
        }

        if (!active && last.current.active) {
            removeKeyHandler("escape");
        }
    });

    useEffect(() => {
        last.current = { active };
    });

    return (
        <DrawerContainer open={active}>
            <Drawer dismissible open={active} className={drawerStyle}>
                <DrawerContent>{children}</DrawerContent>
            </Drawer>
        </DrawerContainer>
    );
});

const renderPlugin = (plugin: Object) => {
    return React.cloneElement(plugin.renderAction(), { key: plugin.name });
};

const Toolbar = ({ activePluginsTop }: Object) => {
    const actionsTop = getPlugins("pb-editor-toolbar-top");
    const actionsBottom = getPlugins("pb-editor-toolbar-bottom");

    return (
        <React.Fragment>
            <ToolbarDrawerContainer>
                {actionsTop
                    .filter(plugin => typeof plugin.renderDrawer === "function")
                    .map(plugin => (
                        <ToolbarDrawer
                            key={plugin.name}
                            name={plugin.name}
                            active={Boolean(activePluginsTop.includes(plugin.name))}
                        >
                            {plugin.renderDrawer()}
                        </ToolbarDrawer>
                    ))}
            </ToolbarDrawerContainer>
            <ToolbarContainer>
                <ToolbarActions>
                    <div>{actionsTop.map(renderPlugin)}</div>
                    <div>{actionsBottom.map(renderPlugin)}</div>
                </ToolbarActions>
            </ToolbarContainer>
        </React.Fragment>
    );
};

export default connect(
    state => ({
        activePluginsTop: getActivePlugins("pb-editor-toolbar-top")(state).map(pl => pl.name),
        activePluginsBottom: getActivePlugins("pb-editor-toolbar-bottom")(state).map(pl => pl.name)
    }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(Toolbar);
