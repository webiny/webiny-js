//@flow
import * as React from "react";
import { css } from "emotion";
import { pure } from "recompose";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

const activeStyle = css({
    "&.mdc-icon-button": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = pure(({
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
});

export default Action;
