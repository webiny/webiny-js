import React from "react";
import styled from "@emotion/styled";
import { Routes, Route } from "@webiny/react-router";
import { Box, Columns } from "~/components/Layout";
import { useCurrentContentReview } from "~/hooks/useContentReview";
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
    const { loading, contentReview } = useCurrentContentReview();

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
                    <Routes>
                        <Route path={"/"}>
                            <PanelBox flex={"1 1 74%"}>
                                <PlaceholderBox
                                    text={`Click on the left side list to display step details`}
                                />
                            </PanelBox>
                        </Route>
                        <Route path={`:stepId`}>
                            <CenterPanel />
                            <ChangeRequestDialog />
                        </Route>
                    </Routes>
                </EditorColumns>
            </Box>
        </ChangeRequestDialogProvider>
    );
};
