import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";
import { usePage } from "~/hooks/usePage.js";

const { Browser } = PageListConfig;

interface IWrappedElementProps {
    element: React.ReactElement | undefined;
}

const WrappedElement = (props: IWrappedElementProps) => {
    const { page } = usePage();
    const state = page.workflows?.state;

    if (!state?.state || state.state === WorkflowStateValue.approved) {
        return props.element;
    }
    return null;
};

export const PageListChangeStatus = Browser.Page.Action.createDecorator(Original => {
    return function PageListChangeStatusAction(props) {
        if (props.name === "changeStatus") {
            return <Original {...props} element={<WrappedElement element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
