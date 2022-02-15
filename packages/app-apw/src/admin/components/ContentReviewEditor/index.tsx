import React from "react";
import styled from "@emotion/styled";
import { useParams, useRouteMatch, Route, Switch } from "@webiny/react-router";
import { Box, Columns } from "~/admin/components/Layout";
import { useContentReview } from "~/admin/views/contentReviewDashboard/hooks/useContentReview";
import { CircularProgress } from "@webiny/ui/Progress";

/**
 * Components
 */
import { ChangeRequestDialogProvider } from "./ChangeRequest/useChangeRequestDialog";
import { ChangeRequestDialog } from "./ChangeRequest/ChangeRequestDialog";
import { PanelBox } from "./Styled";
import { PlaceholderBox } from "./PlaceholderBox";
import { Header } from "./Header";
import { LeftPanel } from "./LeftPanel";
import { CenterPanel } from "./CenterPanel";

const EditorColumns = styled(Columns)`
    background-color: var(--mdc-theme-surface);
    padding: 65px 0 0;
`;

export const ContentReviewEditor: React.FC = () => {
    const { contentReviewId } = useParams() as { contentReviewId: string };
    const { loading, contentReview } = useContentReview({ id: contentReviewId });
    const { path } = useRouteMatch();

    if (loading) {
        return <CircularProgress label={"Loading content review..."} />;
    }

    return (
        <ChangeRequestDialogProvider>
            <Box>
                <Header />
                <EditorColumns space={0}>
                    <LeftPanel
                        steps={contentReview.steps}
                        reviewRequestedOn={contentReview.createdOn}
                        reviewRequestedBy={contentReview.createdBy}
                        status={contentReview.status}
                    />
                    <Switch>
                        <Route exact path={path}>
                            <PanelBox flex={"1 1 74%"}>
                                <PlaceholderBox />
                            </PanelBox>
                        </Route>
                        <Route path={`${path}/:stepId`}>
                            <CenterPanel />
                            <ChangeRequestDialog />
                        </Route>
                    </Switch>
                </EditorColumns>
            </Box>
        </ChangeRequestDialogProvider>
    );
};
