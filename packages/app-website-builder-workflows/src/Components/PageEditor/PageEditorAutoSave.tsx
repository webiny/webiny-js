import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { useWorkflowState } from "@webiny/app-workflows";
import { observer } from "mobx-react-lite";

const { Ui } = PageEditorConfig;

interface IWrappedAutoSave {
    element?: React.ReactElement | null;
}
const WrappedAutoSave = observer((props: IWrappedAutoSave) => {
    const { presenter } = useWorkflowState();
    /**
     * Autosave should work only when the page does not have a workflow state assigned.
     */
    if (!presenter.vm.state?.state) {
        return props.element;
    }

    return null;
});

export const PageEditorAutoSave = Ui.TopBar.Element.createDecorator(Original => {
    return function PageEditorAutoSaveDecorated(props) {
        if (props.name === "autoSave") {
            return <Original {...props} element={<WrappedAutoSave element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
