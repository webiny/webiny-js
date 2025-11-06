import debounce from "lodash/debounce.js";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/admin-ui";
import React from "react";
import { useWorkflowStateList } from "../hooks/index.js";
import { WorkflowStateList } from "../List/index.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateListAppOverlayViewProps {
    hideOverlay: () => void;
}

export const WorkflowStateListAppOverlayView = observer(
    (props: IWorkflowStateListAppOverlayViewProps) => {
        const { hideOverlay } = props;
        const { presenter } = useWorkflowStateList();

        const onTableScroll = debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                await presenter.nextPage();
            }
        }, 200);

        return (
            <OverlayLayout onExited={hideOverlay}>
                <Scrollbar onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}>
                    <WorkflowStateList />
                </Scrollbar>
            </OverlayLayout>
        );
    }
);
