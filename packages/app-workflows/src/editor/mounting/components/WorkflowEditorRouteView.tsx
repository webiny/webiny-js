import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useRoute } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorView } from "~/editor/presentation/editor/components/WorkflowEditorView.js";

export interface WorkflowEditorRouteViewProps {
    route: Route<any>;
    app: WorkflowEditorAppAdapter;
    breadcrumbName: string;
}

/*
 * Reads the optional `?modelId=` of the route (a route without the param, like the WB one, reads
 * as none) and opens that model first. It lives inside the route element because the router keeps
 * the element it was registered with, so a prop of `WorkflowEditorRoute` would never reach it.
 */
export const WorkflowEditorRouteView = createReactiveComponent(
    (props: WorkflowEditorRouteViewProps) => {
        const { route: matched } = useRoute(props.route);
        const modelIdParam = matched?.params?.modelId;
        const initialModelId = typeof modelIdParam === "string" ? modelIdParam : undefined;

        return (
            <WorkflowEditorView
                app={props.app}
                breadcrumbName={props.breadcrumbName}
                initialModelId={initialModelId}
            />
        );
    }
);
