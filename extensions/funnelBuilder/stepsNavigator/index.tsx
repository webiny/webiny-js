import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";
import { StepsNavigator } from "./StepsNavigator.js";

const { Ui } = PageEditorConfig;

export default () => {
    return (
        <PageEditorConfig>
            <Ui.Content.Element
                name={"stepsNavigator"}
                before={"iframe"}
                element={
                    <Ui.IsNotReadOnly>
                        <StepsNavigator />
                    </Ui.IsNotReadOnly>
                }
            />
        </PageEditorConfig>
    );
};
