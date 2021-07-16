import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import UsersDataList from "./UsersDataList";
import UsersForm from "./UsersForm";
import { UsersFormView } from "~/views/Users/UsersFormView";
import { useUserForm } from "~/views/Users/hooks/useUserForm";
import { ViewComponent } from "~/views/Users/View";

const Users = () => {
    return (
        <SplitView>
            <LeftPanel>
                <UsersDataList />
            </LeftPanel>
            <RightPanel>
                <ViewComponent view={new UsersFormView()} hook={useUserForm} />
                <UsersForm />
            </RightPanel>
        </SplitView>
    );
};

export default Users;
