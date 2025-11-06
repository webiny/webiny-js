import React, { useCallback, useMemo, useState } from "react";
import { WorkflowStateListProvider } from "../Provider/index.js";
import type ApolloClient from "apollo-client";
import type { IWorkflowStateListPresenterListParamsWhere } from "~/Presenters/index.js";
import { WorkflowStateListAppOverlayView } from "./WorkflowStateListAppOverlayView.js";

export interface IWorkflowStateListAppOverlayPropsChildrenProps {
    showOverlay: () => void;
}

export interface IWorkflowStateListAppOverlayPropsChildren {
    (props: IWorkflowStateListAppOverlayPropsChildrenProps): React.ReactNode;
}

export interface IWorkflowStateListAppOverlayProps {
    app: string;
    client: ApolloClient<object>;
    children: IWorkflowStateListAppOverlayPropsChildren;
}

export const WorkflowStateListAppOverlay = (props: IWorkflowStateListAppOverlayProps) => {
    const { app, client, children } = props;

    const where = useMemo<IWorkflowStateListPresenterListParamsWhere | undefined>(() => {
        if (!app) {
            return undefined;
        }
        return {
            app
        };
    }, [app]);

    const [show, setShow] = useState(false);

    const toggle = useCallback(() => {
        setShow(prevShow => !prevShow);
    }, []);

    if (!show) {
        return children({
            showOverlay: toggle
        });
    }

    return (
        <WorkflowStateListProvider client={client} where={where}>
            {children({
                showOverlay: toggle
            })}
            {show ? <WorkflowStateListAppOverlayView hideOverlay={toggle} /> : null}
        </WorkflowStateListProvider>
    );
};
