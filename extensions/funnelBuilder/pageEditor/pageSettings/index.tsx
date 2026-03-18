import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";

const { PageSettings } = PageEditorConfig;

export const FubPageSettings = () => {
    return (
        <PageEditorConfig>
            <PageSettings.Group
                name={"custom"}
                title={"Custom"}
                icon={<div />}
                description={"My super custom group"}
            >
                <PageSettings.Element name={"title"} element={<div>element</div>} />
                <PageSettings.Element name={"slug"} element={<div>element</div>} />
                <PageSettings.Element name={"alert"} element={<div>element</div>} />
            </PageSettings.Group>
        </PageEditorConfig>
    );
};
