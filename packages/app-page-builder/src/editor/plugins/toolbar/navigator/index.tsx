import React from "react";
import { css } from "emotion";
import Action from "../Action";
import Navigator from "./Navigator";
import { ReactComponent as NavigatorIcon } from "~/editor/assets/icons/segment_black_24px.svg";
import { PbEditorToolbarTopPlugin } from "~/types";

const drawerClassName = css({
    "&.mdc-drawer--dismissible": {
        width: "280px !important",
        maxWidth: "280px !important"
    },
    "&.mdc-drawer": {
        height: "calc(100% - 64px)"
    }
});

export default () =>
    ({
        name: "pb-editor-toolbar-navigator",
        type: "pb-editor-toolbar-top",
        renderAction() {
            return (
                <Action
                    tooltip={"Navigator"}
                    // plugin={this.name}
                    icon={<NavigatorIcon />}
                    // closeOtherInGroup={true}
                />
            );
        },
        renderDrawer() {
            return <Navigator />;
        },
        toolbar: {
            drawerClassName
        }
    } as PbEditorToolbarTopPlugin);
