//@flow
import React from "react";
import { css } from "emotion";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { compose, lifecycle, withHandlers } from "recompose";
import { togglePlugin } from "@webiny/app-page-builder/editor/actions";
import { IconButton } from "@webiny/ui/Button";
import { withKeyHandler } from "@webiny/app-page-builder/editor/components";
import { getUi, getActivePlugins, isPluginActive } from "@webiny/app-page-builder/editor/selectors";
import { Tooltip } from "@webiny/ui/Tooltip";

const activeStyle = css({
    "&.mdc-icon-button": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = ({ icon, active, tooltip, onClick }) => {
    return (
        <Tooltip
            placement={"bottom"}
            content={<span>{tooltip}</span>}
            {...(active ? { visible: false } : {})}
        >
            <IconButton icon={icon} onClick={onClick} className={active && activeStyle} />
        </Tooltip>
    );
};

export default compose(
    connect(
        (state, props) => ({
            active: isPluginActive(props.plugin)(state),
            // $FlowFixMe
            slateFocused: getUi(state).slateFocused,
            settingsActive: getActivePlugins("pb-page-element-settings")(state).length > 0
        }),
        { togglePlugin }
    ),
    withKeyHandler(),
    withHandlers({
        onClick: ({ onClick, togglePlugin, plugin }) => () => {
            if (typeof onClick === "function") {
                return onClick();
            }
            togglePlugin({ name: plugin, closeOtherInGroup: true });
        }
    }),
    lifecycle({
        componentDidMount() {
            let { addKeyHandler, onClick, shortcut = [] } = this.props;
            if (typeof shortcut === "string") {
                shortcut = [shortcut];
            }

            shortcut.map(short => {
                addKeyHandler(short, e => {
                    const { slateFocused, settingsActive } = this.props;
                    if (slateFocused || settingsActive) {
                        return;
                    }

                    e.preventDefault();
                    onClick();
                });
            });
        },
        componentWillUnmount() {
            let { removeKeyHandler, shortcut = [] } = this.props;

            if (typeof shortcut === "string") {
                shortcut = [shortcut];
            }

            shortcut.map(short => {
                removeKeyHandler(short);
            });
        }
    })
)(Action);