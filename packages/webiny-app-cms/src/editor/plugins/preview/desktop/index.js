//@flow
import * as React from "react";
import { ReactComponent as DesktopIcon } from "webiny-app-cms/editor/assets/icons/round-desktop_mac-24px.svg";
import { Icon } from "webiny-ui/Icon";
import { ListItemGraphic } from "webiny-ui/List";

export default {
    name: "cms-editor-desktop-preview",
    type: "cms-editor-content-preview",
    renderOption(): React.Node {
        return (
            <React.Fragment>
                <ListItemGraphic>
                    <Icon icon={<DesktopIcon />} />
                </ListItemGraphic>
                Desktop
            </React.Fragment>
        );
    },
    renderPreview({ content }: { content: React.Node }) {
        return <div style={{ width: "100%" }}>{content}</div>;
    }
};
