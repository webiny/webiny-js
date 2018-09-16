import React from "react";
import { connect } from "react-redux";
import styled from "react-emotion";
import { compose, lifecycle } from "recompose";
import { deactivatePlugin, updateElement } from "webiny-app-cms/editor/actions";
import { withKeyHandler, withActiveElement } from "webiny-app-cms/editor/components";
import Animate from "webiny-app-cms/editor/components/Editor/Animate";
import { Elevation } from "webiny-ui/Elevation";

const style = {
    width: 360,
    left: "100vw",
    position: "fixed",
    zIndex: 6,
    top: 0,
    backgroundColor: "#fff"
};

const Overlay = styled("div")({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 5
});

const Sidebar = ({ element, plugin, active, updateElement, deactivatePlugin }) => {
    return (
        <React.Fragment>
            <Animate
                trigger={active}
                mountOnEnter
                unmountOnExit
                enterAnimation={{ type: "easeIn", translateX: -360, duration: 250 }}
                exitAnimation={{ type: "easeOut", translateX: 360, duration: 250 }}
            >
                {({ ref }) => (
                    <div ref={ref} style={style}>
                        <Elevation z={active ? 2 : 0} style={{ height: "100vh" }}>
                            {plugin && plugin.renderSidebar()}
                        </Elevation>
                    </div>
                )}
            </Animate>
            {active && (
                <Overlay
                    onClick={() => {
                        updateElement({ element });
                        deactivatePlugin({ name: "element-settings-advanced" });
                    }}
                />
            )}
        </React.Fragment>
    );
};

export default compose(
    connect(
        null,
        { updateElement, deactivatePlugin }
    ),
    withKeyHandler(),
    withActiveElement(),
    lifecycle({
        componentDidUpdate({ active }) {
            const {
                plugin,
                deactivatePlugin,
                element,
                updateElement,
                addKeyHandler,
                removeKeyHandler
            } = this.props;

            if (!active && this.props.active) {
                addKeyHandler("escape", e => {
                    e.preventDefault();
                    updateElement({ element });
                    deactivatePlugin({ name: plugin.name });
                });
            }

            if (active && !this.props.active) {
                removeKeyHandler("escape");
            }
        }
    })
)(Sidebar);
