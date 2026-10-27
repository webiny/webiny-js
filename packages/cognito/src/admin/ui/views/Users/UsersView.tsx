import React, { useReducer } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin";
import UsersDataList from "~/admin/ui/views/Users/UsersDataList.js";
import { useWcp } from "@webiny/app-admin";
import { UserForm } from "./UsersForm.js";

export const UsersView = () => {
    const wcp = useWcp();
    const [usersVersion, refreshUsers] = useReducer((version: number) => version + 1, 0);

    const teams = wcp.canUseTeams();

    return (
        <SplitView>
            <LeftPanel>
                <UsersDataList version={usersVersion} />
            </LeftPanel>
            <RightPanel>
                <UserForm teams={teams} onUserSaved={refreshUsers} />
            </RightPanel>
        </SplitView>
    );
};
