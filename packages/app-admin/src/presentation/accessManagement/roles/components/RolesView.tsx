import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { SplitView } from "~/index.js";
import { LeftPanel } from "~/index.js";
import { RightPanel } from "~/index.js";
import { useRoute } from "~/index.js";
import { RolesPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { RolesDataList } from "./RolesDataList.js";
import { RolesForm } from "./RolesForm.js";

export const RolesView = createReactiveComponent(() => {
    const { presenter } = useFeature(RolesPresenterFeature);
    const { route } = useRoute(Routes.Roles.List);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

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
});
