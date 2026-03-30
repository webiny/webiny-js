import React from "react";
import { PageEditorConfig } from "webiny/admin/website-builder/page/editor";
import { Stepper as Component } from "./Stepper.js";

const { Ui } = PageEditorConfig;

export const Stepper = () => {
    return (
        <PageEditorConfig>
            <Ui.Content.Element
                name={"stepper"}
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
