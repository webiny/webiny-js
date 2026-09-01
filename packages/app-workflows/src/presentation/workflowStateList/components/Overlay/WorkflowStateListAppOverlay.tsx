import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { IWorkflowStateListPresenterListParamsWhere } from "~/presentation/workflowStateList/abstractions.js";
import { useWorkflowStateListPresenter } from "~/presentation/workflowStateList/useWorkflowStateListPresenter.js";
import { WorkflowStateListAppOverlayView } from "./WorkflowStateListAppOverlayView.js";

export interface IWorkflowStateListAppOverlayPropsChildrenProps {
    showOverlay: () => void;
}

export interface IWorkflowStateListAppOverlayPropsChildren {
    (props: IWorkflowStateListAppOverlayPropsChildrenProps): React.ReactNode;
}

export interface IWorkflowStateListAppOverlayProps {
    app: string;
    children: IWorkflowStateListAppOverlayPropsChildren;
}

export const WorkflowStateListAppOverlay = (props: IWorkflowStateListAppOverlayProps) => {
    const { app, children } = props;
    const presenter = useWorkflowStateListPresenter();

    const where = useMemo<IWorkflowStateListPresenterListParamsWhere | undefined>(() => {
        if (!app) {
            return undefined;
        }
        return { app };
    }, [app]);

    const [show, setShow] = useState(false);

    const toggle = useCallback(() => {
        setShow(prevShow => !prevShow);
    }, []);

    useEffect(() => {
        if (show) {
            presenter.list({ where });
        }
    }, [show, where]);

    return (
        <>
            {children({ showOverlay: toggle })}
            {show ? <WorkflowStateListAppOverlayView hideOverlay={toggle} /> : null}
        </>
    );
};
