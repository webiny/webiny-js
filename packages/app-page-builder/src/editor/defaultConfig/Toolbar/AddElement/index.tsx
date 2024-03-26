import React, { useEffect } from "react";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add_circle_outline.svg";
import { EditorConfig } from "~/editor/config";
import { useUI } from "~/editor/hooks/useUI";
import { AddElementDrawer } from "./AddElementDrawer";
import { useDrawer } from "~/editor/config/Toolbar/DrawerProvider";

const { Toolbar } = EditorConfig;

const HideOnDrag = () => {
    const [{ isDragging }] = useUI();
    const { close } = useDrawer();

    useEffect(() => {
        if (isDragging) {
            setTimeout(close, 20);
        }
    }, [isDragging]);

    return null;
};

export const AddElement = () => {
    return (
        <Toolbar.Element.DrawerTrigger
            icon={<AddIcon />}
            label={"Add Element"}
            drawer={
                <Toolbar.Element.Drawer>
                    <HideOnDrag />
                    <AddElementDrawer />
                </Toolbar.Element.Drawer>
            }
        />
    );
};
