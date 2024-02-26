import React, { useCallback } from "react";
import { useEventActionHandler } from "../../hooks/useEventActionHandler";
import { TogglePluginActionEvent } from "../../recoil/actions";
import { isPluginActiveSelector } from "../../recoil/modules";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useRecoilValue } from "recoil";

const activeStyle = css({
    ".mdc-icon-button__icon": {
        color: "var(--mdc-theme-primary)"
    }
});

type IconType = React.ReactElement | React.ReactElement[];

const getButtonIcon = (icon: IconType, isActive: boolean): React.ReactElement => {
    if (Array.isArray(icon)) {
        return isActive ? icon[0] : icon[1];
    }
    return icon;
};
interface ActionPropsType {
    id?: string;
    icon: IconType;
    onClick?: () => any;
    tooltip?: string;
    plugin?: string;
    /*
     * If set "true", will close all other active plugins of same type.
     * */
    closeOtherInGroup?: boolean;
}
const Action = ({ id, icon, onClick, tooltip, plugin, closeOtherInGroup }: ActionPropsType) => {
    const handler = useEventActionHandler();
    const isActive = useRecoilValue(isPluginActiveSelector(plugin as string));

    const togglePlugin = useCallback(() => {
        if (!plugin) {
            return;
        }
        handler.trigger(
            new TogglePluginActionEvent({
                name: plugin,
                closeOtherInGroup: closeOtherInGroup
            })
        );
    }, [plugin, closeOtherInGroup]);

    const clickHandler = useCallback(() => {
        if (typeof onClick === "function") {
            return onClick();
        }
        togglePlugin();
    }, [plugin, closeOtherInGroup]);

    const btnIcon = getButtonIcon(icon, isActive);

    const iconButton = (
        <IconButton
            id={id}
            icon={btnIcon}
            onClick={clickHandler}
            className={isActive ? activeStyle : ""}
        />
    );

    if (tooltip) {
        return (
            <Tooltip
                placement={"right"}
                content={<span>{tooltip}</span>}
                {...(isActive ? { visible: false } : {})}
            >
                {iconButton}
            </Tooltip>
        );
    }

    return iconButton;
};

export default React.memo(Action);
