import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { useRouter } from "@webiny/react-router";
import ContentDataList from "./ContentDataList";
import ContentDetails from "./ContentDetails";

export const ContentEntries = ({ contentModel }) => {
    const { history } = useRouter();

    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel span={4}>
                    <ContentDataList contentModel={contentModel} />
                </LeftPanel>
                <RightPanel span={8}>
                    <ContentDetails contentModel={contentModel} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => history.push(`/cms/content-entries/${contentModel.modelId}`)}
            />
        </React.Fragment>
    );
};
