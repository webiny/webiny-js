import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { useWorkflowState } from "@webiny/app-workflows";
import { observer } from "mobx-react-lite";

const { Ui } = PageEditorConfig;

interface IWrappedSettings {
    element?: React.ReactElement | null;
}

const WrappedSettings = observer((props: IWrappedSettings) => {
    const { presenter } = useWorkflowState();
    if (!presenter.vm.state?.state) {
        return props.element;
    }

    return null;
});

export const PageEditorSettings = Ui.TopBar.Action.createDecorator(Original => {
    return function PageEditorSettingsDecorated(props) {
        if (props.name === "buttonSettings") {
            return <Original {...props} element={<WrappedSettings element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
