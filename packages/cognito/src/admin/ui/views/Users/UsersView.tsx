import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin";
import UsersDataList from "~/admin/ui/views/Users/UsersDataList.js";
import { useWcp } from "@webiny/app-admin";
import { UserForm } from "./UsersForm.js";

export const UsersView = () => {
    const wcp = useWcp();

    const teams = wcp.canUseTeams();

    return (
        <SplitView>
            <LeftPanel>
                <UsersDataList />
            </LeftPanel>
            <RightPanel>
                <UserForm teams={teams} />
            </RightPanel>
        </SplitView>
    );
};
