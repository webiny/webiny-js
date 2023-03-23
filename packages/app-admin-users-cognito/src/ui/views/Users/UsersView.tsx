import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { UsersFormView } from "~/ui/views/Users/UsersFormView";
import UsersDataList from "~/ui/views/Users/UsersDataList";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";

export const UsersView: React.VFC = () => {
    return (
        <SplitView>
            <LeftPanel>
                <UsersDataList />
            </LeftPanel>
            <RightPanel>
                <UIViewComponent view={new UsersFormView()} />
            </RightPanel>
        </SplitView>
    );
};
