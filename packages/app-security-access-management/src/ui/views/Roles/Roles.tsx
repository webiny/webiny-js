import React from "react";
import { SplitView, LeftPanel, RightPanel, useRoute } from "@webiny/app-admin";
import { RolesDataList } from "./RolesDataList.js";
import { RolesForm } from "./RolesForm.js";
import { Routes } from "~/routes.js";

export const Roles = () => {
    const { route } = useRoute(Routes.Roles.List);

    return (
        <SplitView>
            <LeftPanel>
                <RolesDataList activeId={route.params.id} />
            </LeftPanel>
            <RightPanel>
                <RolesForm newEntry={route.params.new === true} id={route.params.id} />
            </RightPanel>
        </SplitView>
    );
};
