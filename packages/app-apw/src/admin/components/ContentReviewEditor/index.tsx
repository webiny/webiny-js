import React from "react";
import styled from "@emotion/styled";
import { Box, Columns } from "~/admin/components/Layout";

import Header from "./Header";
import LeftPanel from "./LeftPanel";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import ChangeRequestDialog from "./ChangeRequest/ChangeRequestDialog";
import { ChangeRequestDialogProvider } from "./ChangeRequest/useChangeRequestDialog";

const EditorColumns = styled(Columns)`
    background-color: var(--mdc-theme-surface);
    padding: 65px 0 0;
`;

function ContentReviewEditor() {
    return (
        <ChangeRequestDialogProvider>
            <Box>
                <Header />
                <EditorColumns space={0}>
                    <LeftPanel />
                    <CenterPanel />
                    <RightPanel />
                </EditorColumns>
                <ChangeRequestDialog />
            </Box>
        </ChangeRequestDialogProvider>
    );
}

export default ContentReviewEditor;
