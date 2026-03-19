import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";
import { ReactComponent as StarIcon } from "webiny/admin/icons/star.svg";

const { PageSettings } = PageEditorConfig;

export const FubPageSettings = () => {
    return (
        <PageEditorConfig>
            <PageSettings.ViewMode.Drawer />
            <PageSettings.Group
                name={"custom"}
                title={"Custom"}
                icon={<StarIcon />}
                description={"My super custom group"}
            >
                <PageSettings.Element name={"title"} element={<div>element</div>} />
            </PageSettings.Group>
        </PageEditorConfig>
    );
};
