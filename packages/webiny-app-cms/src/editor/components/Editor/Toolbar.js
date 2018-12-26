//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import styled from "react-emotion";
import { css } from "emotion";
import { isEqual } from "lodash";
import { compose, lifecycle } from "recompose";
import { Drawer, DrawerContent } from "webiny-ui/Drawer";
import { getPlugins } from "webiny-plugins";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { deactivatePlugin } from "webiny-app-cms/editor/actions";
import { getActivePlugins } from "webiny-app-cms/editor/selectors";

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

const drawerKeyHandler = compose(
    connect(
        null,
        { deactivatePlugin }
    ),
    withKeyHandler(),
    lifecycle({
        componentDidUpdate({ active, name }) {
            if (!active && this.props.active) {
                this.props.addKeyHandler("escape", e => {
                    e.preventDefault();
                    this.props.deactivatePlugin({ name });
                });
            }

            if (active && !this.props.active) {
                this.props.removeKeyHandler("escape");
            }
        }
    })
);

const ToolbarDrawer = drawerKeyHandler(({ active, children }) => (
    <DrawerContainer open={active}>
        <Drawer dismissible open={active} className={drawerStyle}>
            <DrawerContent>{children}</DrawerContent>
        </Drawer>
    </DrawerContainer>
));

const renderPlugin = (plugin: Object) => {
    return React.cloneElement(plugin.renderAction(), { key: plugin.name });
};

const Toolbar = ({ activePluginsTop }: Object) => {
    const actionsTop = getPlugins("cms-toolbar-top");
    const actionsBottom = getPlugins("cms-toolbar-bottom");

    return (
        <React.Fragment>
            <ToolbarDrawerContainer>
                {actionsTop
                    .filter(plugin => typeof plugin.renderDrawer === "function")
                    .map(plugin => (
                        <ToolbarDrawer
                            key={plugin.name}
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
        activePluginsTop: getActivePlugins("cms-toolbar-top")(state).map(pl => pl.name),
        activePluginsBottom: getActivePlugins("cms-toolbar-bottom")(state).map(pl => pl.name)
    }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(Toolbar);
