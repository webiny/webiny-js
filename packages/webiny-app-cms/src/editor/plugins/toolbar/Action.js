//@flow
import * as React from "react";
import { css } from "emotion";
import { connect } from "react-redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { compose, withHandlers } from "recompose";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

const activeStyle = css({
    ".mdc-icon-button__icon": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = ({
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
    const iconButton = (
        <IconButton icon={icon} onClick={onClick} className={active && activeStyle} />
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
};

export default compose(
    connect(
        null,
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
