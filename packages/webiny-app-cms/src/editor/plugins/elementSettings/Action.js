//@flow
import React from "react";
import { css } from "emotion";
import { connect } from "react-redux";
import { compose, lifecycle, withHandlers } from "recompose";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { IconButton } from "webiny-ui/Button";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getUi, getActivePlugin } from "webiny-app-cms/editor/selectors";
import { Tooltip } from "webiny-ui/Tooltip";

const activeStyle = css({
    "&.mdc-icon-button": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = ({ icon, onClick, active, tooltip }) => {
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
        state => ({
            slateFocused: getUi(state).slateFocused,
            settingsActive: getActivePlugin("cms-element-settings")(state)
        }),
        { togglePlugin }
    ),
    withKeyHandler(),
    withHandlers({
        onClick: ({ onClick, togglePlugin, plugin }) => () => {
            if (typeof onClick === "function") {
                return onClick();
            }
            togglePlugin({ name: plugin });
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
