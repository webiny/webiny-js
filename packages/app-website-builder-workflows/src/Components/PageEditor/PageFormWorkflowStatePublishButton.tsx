import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { usePage } from "@webiny/app-website-builder/modules/pages/PagesList/hooks/usePage.js";
import type { PageDto } from "@webiny/app-website-builder/domain/Page/index.js";
import type { WithWorkflowState } from "~/types.js";
import { WorkflowStateValue } from "@webiny/app-workflows";

const { Ui } = PageEditorConfig;

// TODO remove when implemented proper extension for page
const decoratePage = (page: PageDto): WithWorkflowState<PageDto> => {
    return {
        ...page,
        // @ts-expect-error
        state: page.state
    };
};

interface IWrappedPublishButtonProps {
    element?: React.ReactElement | null;
}

const WrappedPublishButton = (props: IWrappedPublishButtonProps) => {
    const { page } = usePage();

    const { state } = decoratePage(page);
    console.log({
        page,
        state
    });

    if (!state?.state || state.state === WorkflowStateValue.approved) {
        return props.element;
    }

    return null;
};

export const PageFormWorkflowStatePublishButton = Ui.TopBar.Action.createDecorator(Original => {
    return function AutoSaveDecorator(props) {
        console.log({
            ...props,
            element: undefined
        });
        if (props.name === "buttonPublish") {
            return (
                <Original {...props} element={<WrappedPublishButton element={props.element} />} />
            );
        }
        return <Original {...props} />;
        // return <Ui.TopBar.Action remove={true} name={"buttonPublish"} />
    };
});
