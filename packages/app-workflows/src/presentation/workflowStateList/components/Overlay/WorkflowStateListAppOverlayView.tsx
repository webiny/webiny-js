import debounce from "lodash/debounce.js";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/admin-ui";
import React, { useMemo } from "react";
import { useWorkflowStateListPresenter } from "~/presentation/workflowStateList/useWorkflowStateListPresenter.js";
import { WorkflowStateList } from "../List/index.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateListAppOverlayViewProps {
    hideOverlay: () => void;
}

export const WorkflowStateListAppOverlayView = observer(
    (props: IWorkflowStateListAppOverlayViewProps) => {
        const { hideOverlay } = props;
        const presenter = useWorkflowStateListPresenter();

        const onTableScroll = useMemo(() => {
            return debounce(async ({ scrollFrame }) => {
                if (scrollFrame.top > 0.8) {
                    await presenter.nextPage();
                }
            }, 200);
        }, [presenter]);

        return (
            <OverlayLayout onExited={hideOverlay} barLeft={<>Content Reviews</>}>
                <Scrollbar onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}>
                    <WorkflowStateList />
                </Scrollbar>
            </OverlayLayout>
        );
    }
);
