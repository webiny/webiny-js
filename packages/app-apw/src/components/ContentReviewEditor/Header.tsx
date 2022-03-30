import React from "react";
import styled from "@emotion/styled";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { renderPlugins } from "@webiny/app/plugins";

const EditorTopAppBar = styled(TopAppBar)`
    box-shadow: 1px 0 5px 0 rgba(128, 128, 128, 1);
    color: var(--mdc-theme-text-primary-on-background);
`;

export const Header = () => {
    return (
        <EditorTopAppBar fixed data-testid={"apw-editor-top-bar"}>
            <TopAppBarSection style={{ width: "50%" }}>
                {renderPlugins("content-review-editor-default-bar-left")}
            </TopAppBarSection>
            <TopAppBarSection style={{ width: "50%" }} alignEnd>
                {renderPlugins("content-review-editor-default-bar-right")}
            </TopAppBarSection>
        </EditorTopAppBar>
    );
};
