import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { SplitView, LeftPanel, RightPanel, useRoute } from "@webiny/app-admin";
import { ModelGroupPresenterFeature } from "~/presentation/modelGroup/feature.js";
import { Routes } from "~/routes.js";
import { ContentModelGroupsDataList } from "./ContentModelGroupsDataList.js";
import { ContentModelGroupsForm } from "./ContentModelGroupsForm.js";

const ContentModelGroups = observer(() => {
    const { presenter } = useFeature(ModelGroupPresenterFeature);
    const { route } = useRoute(Routes.ContentModelGroups.List);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <SplitView>
            <LeftPanel span={4}>
                <ContentModelGroupsDataList activeId={route.params.id} />
            </LeftPanel>
            <RightPanel span={8}>
                <div className={"w-full overflow-y-auto h-main-content"}>
                    <ContentModelGroupsForm
                        newEntry={route.params.new === true}
                        id={route.params.id}
                    />
                </div>
            </RightPanel>
        </SplitView>
    );
});

export default ContentModelGroups;
