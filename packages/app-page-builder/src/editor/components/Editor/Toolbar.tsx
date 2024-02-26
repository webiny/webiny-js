import React, { ReactElement, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import styled from "@emotion/styled";
import { css } from "emotion";
import { DrawerLeft, DrawerContent } from "@webiny/ui/Drawer";
import { plugins } from "@webiny/plugins";
import { makeDecoratable } from "@webiny/app-admin";
import { PbEditorToolbarBottomPlugin, PbEditorToolbarTopPlugin } from "~/types";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { DeactivatePluginActionEvent } from "~/editor/recoil/actions";
import { activePluginsByTypeNamesSelector } from "~/editor/recoil/modules";

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
const DrawerContainer = styled("div")<{ open: boolean }>(({ open }) => ({
    pointerEvents: open ? "all" : "none",
    ".mdc-drawer__drawer": {
        "> .mdc-list": {
            padding: 0
        }
    }
}));
const ToolbarActionsWrapper = styled("div")({
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
        height: "calc(100vh - 64px)",
        width: "280px !important",
        maxWidth: "280px !important",
        ".mdc-drawer__content": {
            width: "100%"
        }
    }
});
interface ToolbarDrawerProps {
    name: string;
    active: boolean;
    children: React.ReactNode;
    drawerClassName?: string;
}
const ToolbarDrawer = ({ name, active, children, drawerClassName }: ToolbarDrawerProps) => {
    const eventActionHandler = useEventActionHandler();
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();
    const last = useRef<{ active: boolean | null }>({
        active: null
    });
    useEffect(() => {
        if (active && !last.current.active) {
            addKeyHandler("escape", e => {
                e.preventDefault();
                eventActionHandler.trigger(
                    new DeactivatePluginActionEvent({
                        name
                    })
                );
            });
        }
        if (!active && last.current.active) {
            removeKeyHandler("escape");
        }
    });
    useEffect(() => {
        last.current = {
            active
        };
    });
    return (
        <DrawerContainer open={active}>
            <DrawerLeft
                dismissible
                open={active}
                className={classNames(drawerStyle, drawerClassName)}
            >
                <DrawerContent>{children}</DrawerContent>
            </DrawerLeft>
        </DrawerContainer>
    );
};
export const renderPlugin = (plugin: PbEditorToolbarTopPlugin | PbEditorToolbarBottomPlugin) => {
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
                            name={plugin.name as string}
                            active={Boolean(activePluginsTop.includes(plugin.name as string))}
                            drawerClassName={plugin.toolbar && plugin.toolbar.drawerClassName}
                        >
                            {(plugin.renderDrawer as () => ReactElement)()}
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

export interface ToolbarActionsProps {
    children: React.ReactNode;
}

export const ToolbarActions = makeDecoratable(
    "ToolbarActions",
    ({ children }: ToolbarActionsProps) => {
        return <ToolbarActionsWrapper>{children}</ToolbarActionsWrapper>;
    }
);
