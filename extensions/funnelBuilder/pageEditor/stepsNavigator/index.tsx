import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";
import { StepsNavigator as Component } from "./StepsNavigator.js";

const { Ui } = PageEditorConfig;

export const StepsNavigator = () => {
    return (
        <PageEditorConfig>
            <Ui.Content.Element
                name={"stepsNavigator"}
                before={"iframe"}
                element={
                    <Ui.IsNotReadOnly>
                        <Component />
                    </Ui.IsNotReadOnly>
                }
            />
        </PageEditorConfig>
    );
};
