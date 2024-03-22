import React, { useCallback } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

interface ActionPropsType {
    id?: string;
    icon: JSX.Element;
    onClick?: () => any;
    tooltip?: string;
}
const Action = ({ id, icon, onClick, tooltip }: ActionPropsType) => {
    const clickHandler = useCallback(() => {
        if (typeof onClick === "function") {
            return onClick();
        }
    }, []);

    const iconButton = <IconButton id={id} icon={icon} onClick={clickHandler} />;

    if (tooltip) {
        return (
            <Tooltip placement={"right"} content={<span>{tooltip}</span>}>
                {iconButton}
            </Tooltip>
        );
    }

    return iconButton;
};

export default React.memo(Action);
