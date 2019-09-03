//@flow
import React, { useCallback } from "react";
import { css } from "emotion";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { togglePlugin } from "@webiny/app-page-builder/editor/actions";
import { isPluginActive } from "@webiny/app-page-builder/editor/selectors";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

const activeStyle = css({
    ".mdc-icon-button__icon": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = React.memo(({ icon, onClick, active, tooltip, togglePlugin, plugin }) => {
    const clickHandler = useCallback(() => {
        if (typeof onClick === "function") {
            return onClick();
        }
        togglePlugin({ name: plugin });
    }, [plugin]);

    let btnIcon = icon;
    if (Array.isArray(icon)) {
        btnIcon = active ? icon[0] : icon[1];
    }

    const iconButton = (
        <IconButton icon={btnIcon} onClick={clickHandler} className={active && activeStyle} />
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

export default connect(
    (state, props) => ({
        active: isPluginActive(props.plugin)(state)
    }),
    { togglePlugin }
)(Action);
