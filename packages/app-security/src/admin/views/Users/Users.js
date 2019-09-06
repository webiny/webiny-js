import React from "react";
import { pick } from "lodash";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import UsersDataList from "./UsersDataList";
import UsersForm from "./UsersForm";
import { CREATE_USER, DELETE_USER, READ_USER, LIST_USERS, UPDATE_USER } from "./graphql";
import { CrudProvider } from "@webiny/app-admin/context/CrudContext";

const variables = data => {
    return {
        data: {
            ...pick(data, ["email", "password", "firstName", "lastName", "avatar", "enabled"]),
            roles: (data.roles || []).map(x => x.id),
            groups: (data.groups || []).map(x => x.id)
        }
    };
};

const Users = () => {
    return (
        <CrudProvider
            create={{ mutation: CREATE_USER, variables }}
            read={READ_USER}
            update={{ mutation: UPDATE_USER, variables }}
            delete={DELETE_USER}
            list={{
                query: LIST_USERS,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel>
                            <UsersDataList />
                        </LeftPanel>
                        <RightPanel>
                            <UsersForm />
                        </RightPanel>
                    </SplitView>
                    <FloatingActionButton onClick={actions.resetForm} />
                </>
            )}
        </CrudProvider>
    );
};

export default Users;
