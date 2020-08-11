import * as React from "react";
import { pick } from "lodash";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import EntitiesDataList from "./EntitiesDataList";
import EntitiesForm from "./EntityForm";
import { READ_ENTITY, LIST_ENTITIES, CREATE_ENTITY, UPDATE_ENTITY, DELETE_ENTITY } from "./graphql";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";

const Entities = ({ scopes, formProps, listProps }: any) => {
    const variables = data => ({
        data: {
            ...pick(data, ["title", "description", "isNice"])
        }
    });

    return (
        <React.Fragment>
            <CrudProvider
                delete={DELETE_ENTITY}
                read={READ_ENTITY}
                list={{
                    query: LIST_ENTITIES,
                    variables: { sort: { savedOn: -1 } }
                }}
                update={{
                    mutation: UPDATE_ENTITY,
                    variables
                }}
                create={{
                    mutation: CREATE_ENTITY,
                    variables
                }}
            >
                {({ actions }) => (
                    <>
                        <SplitView>
                            <LeftPanel>
                                <EntitiesDataList {...listProps} />
                            </LeftPanel>
                            <RightPanel>
                                <EntitiesForm scopes={scopes} {...formProps} />
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

export default Entities;
