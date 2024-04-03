import React, { useEffect } from "react";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add_circle_outline.svg";
import { EditorConfig } from "~/editor/config";
import { useUI } from "~/editor/hooks/useUI";
import { AddElementDrawer } from "./AddElementDrawer";
import { useDrawer } from "~/editor/config/Toolbar/Drawers/DrawerProvider";

const { Ui } = EditorConfig;

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
        <Ui.Toolbar.Element.DrawerTrigger
            icon={<AddIcon />}
            label={"Add Element"}
            drawer={
                <Ui.Toolbar.Element.Drawer>
                    <HideOnDrag />
                    <AddElementDrawer />
                </Ui.Toolbar.Element.Drawer>
            }
        />
    );
};
