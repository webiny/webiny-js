import React, { useMemo } from "react";
import type { IWorkflowApplication } from "~/types.js";
// import { WorkflowsApplications } from "./WorkflowsApplications.js";
import { WorkflowEditor } from "./WorkflowEditor.js";
import {
    LeftPanel,
    RightPanel,
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader,
    SplitView
} from "@webiny/app-admin";
import { WorkflowsDataList } from "./WorkflowsDataList.js";
import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";

export interface IWorkflowsViewProps {
    apps: IWorkflowApplication[];
    app: string | null | undefined;
    onAppClick: (id: string) => void;
}

export const WorkflowsView = (props: IWorkflowsViewProps) => {
    const { apps, app: initialApp, onAppClick } = props;

    const app = useMemo(() => {
        if (!initialApp) {
            return null;
        }
        return apps.find(a => a.id === initialApp);
    }, [initialApp, apps]);

    // TODO: finish this up
    // const { apps, app: initialApp, onAppClick } = props;
    //
    // const app = useMemo(() => {
    //     if (!initialApp) {
    //         return null;
    //     }
    //     return apps.find(a => a.id === initialApp);
    // }, [initialApp, apps]);
    //
    // if (!apps.length) {
    //     return (
    //         <Grid>
    //             <Grid.Column span={12}>
    //                 <Alert type="danger" title="No applications found.">
    //                     There are no applications available.
    //                 </Alert>
    //             </Grid.Column>
    //         </Grid>
    //     );
    // } else if (initialApp && !app) {
    //     return (
    //         <Grid>
    //             <Grid.Column span={12}>
    //                 <Alert type="danger" title="No application found.">
    //                     Application you selected does not exist: <strong>{initialApp}</strong>.
    //                 </Alert>
    //             </Grid.Column>
    //         </Grid>
    //     );
    // }
    //

    return (
        <SplitView>
            <LeftPanel>
                <WorkflowsDataList apps={apps} activeId={app?.id} onSelectApp={onAppClick} />
            </LeftPanel>
            <RightPanel>
                {app && (
                    <SimpleForm size={"lg"}>
                        {/*{loading && <OverlayLoader />}*/}
                        <SimpleFormHeader title={app.name} />
                        <SimpleFormContent>
                            <WorkflowEditor app={app} />
                        </SimpleFormContent>
                        <SimpleFormFooter>TODO: Submit btn form here</SimpleFormFooter>
                    </SimpleForm>
                )}
            </RightPanel>
        </SplitView>
    );
};
