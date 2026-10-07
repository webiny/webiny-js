import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { SplitView } from "~/index.js";
import { LeftPanel } from "~/index.js";
import { RightPanel } from "~/index.js";
import { useRoute } from "~/index.js";
import { TeamsPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { TeamsDataList } from "./TeamsDataList.js";
import { TeamsForm } from "./TeamsForm.js";

export const TeamsView = createReactiveComponent(() => {
    const { presenter } = useFeature(TeamsPresenterFeature);
    const { route } = useRoute(Routes.Teams.List);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <SplitView>
            <LeftPanel>
                <TeamsDataList activeId={route.params.id} />
            </LeftPanel>
            <RightPanel>
                <TeamsForm newEntry={route.params.new === true} id={route.params.id} />
            </RightPanel>
        </SplitView>
    );
});
