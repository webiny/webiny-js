//@flow
import * as React from "react";
import { css } from "emotion";
import { connect } from "react-redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { isPluginActive } from "webiny-app-cms/editor/selectors";
import { compose, withHandlers, pure } from "recompose";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

const activeStyle = css({
    ".mdc-icon-button__icon": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = pure(
    ({
        icon,
        onClick,
        active,
        tooltip
    }: {
        icon: React.Element<any>,
        onClick: Function,
        active?: Boolean,
        tooltip?: string
    }) => {
        let btnIcon = icon;
        if (Array.isArray(icon)) {
            btnIcon = active ? icon[0] : icon[1];
        }

        const iconButton = (
            <IconButton icon={btnIcon} onClick={onClick} className={active && activeStyle} />
        );

        if (tooltip) {
            return (
                <Tooltip
                    placement={"right"}
                    content={<span>{tooltip}</span>}
                    {...(active ? { visible: false } : {})}
                >
                    {iconButton}
                </Tooltip>
            );
        }

        return iconButton;
    }
);

export default compose(
    connect(
        (state, props) => ({
            active: isPluginActive(props.plugin)(state)
        }),
        { togglePlugin }
    ),
    withHandlers({
        onClick: ({ onClick, togglePlugin, plugin }) => () => {
            if (typeof onClick === "function") {
                return onClick();
            }
            togglePlugin({ name: plugin });
        }
    })
)(Action);
