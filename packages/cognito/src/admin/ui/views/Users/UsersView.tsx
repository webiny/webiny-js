import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin";
import UsersDataList from "~/admin/ui/views/Users/UsersDataList.js";
import { useFeatureFlags } from "@webiny/app-admin";
import { UserForm } from "./UsersForm.js";

export const UsersView = () => {
    const featureFlags = useFeatureFlags();

    const teams = featureFlags.isTeamsEnabled();

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
