import React, { useEffect, useRef } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { generateId } from "@webiny/utils";
import { useDrawers } from "./DrawersProvider";

export interface DrawerTriggerProps {
    icon: JSX.Element;
    label: string;
    drawer: JSX.Element;
}

export const DrawerTrigger = ({ drawer, label, icon }: DrawerTriggerProps) => {
    const drawerId = useRef(generateId());
    const { isActive, setActive, registerDrawer } = useDrawers();

    useEffect(() => {
        return registerDrawer(drawerId.current, drawer);
    }, []);

    const toggleDrawer = () => {
        const id = drawerId.current;
        if (isActive(id)) {
            setActive(undefined);
            return;
        }

        setActive(id);
    };

    return (
        <Tooltip placement={"right"} content={label}>
            <IconButton icon={icon} onClick={toggleDrawer} />
        </Tooltip>
    );
};
