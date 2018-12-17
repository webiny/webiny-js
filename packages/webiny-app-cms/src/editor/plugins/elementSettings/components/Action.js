//@flow
import React from "react";
import { css } from "emotion";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, lifecycle, withHandlers } from "recompose";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { IconButton } from "webiny-ui/Button";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getUi, getActivePlugins, isPluginActive } from "webiny-app-cms/editor/selectors";
import { Tooltip } from "webiny-ui/Tooltip";

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
            settingsActive: getActivePlugins("cms-element-settings")(state).length > 0
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
            const { addKeyHandler, onClick, shortcut } = this.props;
            addKeyHandler(shortcut, e => {
                const { slateFocused, settingsActive } = this.props;
                if (slateFocused || settingsActive) {
                    return;
                }

                e.preventDefault();
                onClick();
            });
        },
        componentWillUnmount() {
            const { removeKeyHandler, shortcut } = this.props;
            removeKeyHandler(shortcut);
        }
    })
)(Action);
