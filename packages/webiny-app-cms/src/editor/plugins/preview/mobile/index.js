//@flow
import * as React from "react";
import { ReactComponent as MobileIcon } from "webiny-app-cms/editor/assets/icons/round-smartphone-24px.svg";
import { Icon } from "webiny-ui/Icon";
import { ListItemGraphic } from "webiny-ui/List";

export default {
    name: "cms-editor-mobile-preview",
    type: "cms-editor-content-preview",
    renderOption(): React.Node {
        return (
            <React.Fragment>
                <ListItemGraphic>
                    <Icon icon={<MobileIcon />} />
                </ListItemGraphic>
                Mobile
            </React.Fragment>
        );
    },
    renderPreview({ content }: { content: React.Node }) {
        return <div style={{ width: "50%", margin: "0 auto" }}>{content}</div>;
    }
};
