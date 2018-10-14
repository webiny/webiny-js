//@flow
import * as React from "react";
import { css } from "emotion";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

const activeStyle = css({
    "&.mdc-icon-button": {
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
    tooltip: string
}) => {
    return (
        <Tooltip
            placement={"right"}
            content={<span>{tooltip}</span>}
            {...(active ? { visible: false } : {})}
        >
            <IconButton icon={icon} onClick={onClick} className={active && activeStyle} />
        </Tooltip>
    );
};

export default Action;
