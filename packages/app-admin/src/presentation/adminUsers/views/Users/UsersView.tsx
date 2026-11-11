import React from "react";
import { LeftPanel, RightPanel, SplitView } from "~/components/SplitView/SplitView.js";
import UsersDataList from "~/presentation/adminUsers/views/Users/UsersDataList.js";
import { useFeatureFlags } from "~/presentation/featureFlags/useFeatureFlags.js";
import { UserForm } from "./UsersForm.js";

export const UsersView = () => {
    const featureFlags = useFeatureFlags();

    const teams = featureFlags.isEnabled("advancedAccessControlLayer.teams");

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
