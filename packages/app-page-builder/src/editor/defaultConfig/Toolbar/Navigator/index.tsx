import React from "react";
import { css } from "emotion";
import { ReactComponent as NavigatorIcon } from "~/editor/assets/icons/segment_black_24px.svg";
import { EditorConfig } from "~/editor/config";
import { NavigatorDrawer } from "./NavigatorDrawer";

const drawerClassName = css({
    "&.mdc-drawer--dismissible": {
        width: "280px !important",
        maxWidth: "280px !important"
    },
    "&.mdc-drawer": {
        height: "calc(100% - 64px)"
    }
});

const { Ui } = EditorConfig;

export const Navigator = () => {
    return (
        <Ui.Toolbar.Element.DrawerTrigger
            icon={<NavigatorIcon />}
            label={"Navigator"}
            drawer={
                <Ui.Toolbar.Element.Drawer drawerClassName={drawerClassName}>
                    <NavigatorDrawer />
                </Ui.Toolbar.Element.Drawer>
            }
        />
    );
};
