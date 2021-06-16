import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import UsersDataList from "./UsersDataList";
import UsersForm from "./UsersForm";

const Users = () => {
    return (
        <SplitView>
            <LeftPanel>
                <UsersDataList />
            </LeftPanel>
            <RightPanel>
                <UsersForm />
            </RightPanel>
        </SplitView>
    );
};

export default Users;
