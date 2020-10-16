import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import {
    activePluginsByTypeNamesSelector,
    deactivatePluginMutation
} from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { plugins } from "@webiny/plugins";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import {
    PbEditorToolbarBottomPlugin,
    PbEditorToolbarTopPlugin
} from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

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
const DrawerContainer = styled("div")(({ open }: any) => ({
    pointerEvents: open ? "all" : "none",
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
type ToolbarDrawerProps = {
    name: string;
    active: boolean;
    children: React.ReactNode;
};
const ToolbarDrawer: React.FC<ToolbarDrawerProps> = ({ name, active, children }) => {
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();
    const last = useRef({ active: null });
    useEffect(() => {
        if (active && !last.current.active) {
            addKeyHandler("escape", e => {
                e.preventDefault();
                deactivatePluginMutation(name);
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
};
const renderPlugin = (plugin: PbEditorToolbarTopPlugin | PbEditorToolbarBottomPlugin) => {
    return React.cloneElement(plugin.renderAction(), { key: plugin.name });
};

const Toolbar = () => {
    const activePluginsTop = useRecoilValue(
        activePluginsByTypeNamesSelector("pb-editor-toolbar-top")
    );
    const actionsTop = plugins.byType<PbEditorToolbarTopPlugin>("pb-editor-toolbar-top");
    const actionsBottom = plugins.byType<PbEditorToolbarBottomPlugin>("pb-editor-toolbar-bottom");
    return (
        <>
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
        </>
    );
};
export default React.memo(Toolbar);
