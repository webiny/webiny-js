import React from "react";
import { pick } from "lodash";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import TargetsDataList from "./TargetsDataList";
import TargetsForm from "./TargetForm";
import { READ_TARGET, LIST_TARGETS, CREATE_TARGET, UPDATE_TARGET, DELETE_TARGET } from "./graphql";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";

const Targets = ({ scopes, formProps, listProps }: any) => {
    const variables = data => ({
        data: {
            ...pick(data, ["title", "description", "isNice"])
        }
    });

    return (
        <React.Fragment>
            <CrudProvider
                delete={DELETE_TARGET}
                read={READ_TARGET}
                list={{
                    query: LIST_TARGETS,
                    variables: { sort: "savedOn_DESC" }
                }}
                update={{
                    mutation: UPDATE_TARGET,
                    variables
                }}
                create={{
                    mutation: CREATE_TARGET,
                    variables
                }}
            >
                {({ actions }) => (
                    <>
                        <SplitView>
                            <LeftPanel>
                                <TargetsDataList {...listProps} />
                            </LeftPanel>
                            <RightPanel>
                                <TargetsForm scopes={scopes} {...formProps} />
                            </RightPanel>
                        </SplitView>
                        <FloatingActionButton
                            data-testid="new-record-button"
                            onClick={actions.resetForm}
                        />
                    </>
                )}
            </CrudProvider>
        </React.Fragment>
    );
};

export default Targets;
