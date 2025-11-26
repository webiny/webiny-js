import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";
import type { WithWorkflowState } from "~/types.js";
import type { PageDto } from "@webiny/app-website-builder/domain/Page/index.js";
import { usePage } from "@webiny/app-website-builder/modules/pages/PagesList/hooks/usePage.js";

const { Browser } = PageListConfig;

const decoratePage = (page: PageDto): WithWorkflowState<PageDto> => {
    return {
        ...page,
        // @ts-expect-error
        state: page.state
    };
};

export const PageListChangeStatus = Browser.Page.Action.createDecorator(Original => {
    return function PageListChangeStatusAction(props) {
        /**
         * This is wrong to do, but its here to show that this should work.
         * The component is inside the PageListConfig, so usePage should work
         */
        let page: PageDto;
        try {
            page = usePage().page;
        } catch (ex) {
            console.log({
                error: ex.message,
                ...props
            });
            return <Original {...props} />;
        }
        // const { page } = usePage();
        const { state } = decoratePage(page);
        if (
            props.name !== "changeStatus" ||
            !state?.state ||
            state.state === WorkflowStateValue.approved
        ) {
            return <Original {...props} />;
        }

        return null;
    };
});
