import React from "react";
import { css } from "emotion";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { makeComposable } from "@webiny/app-admin";
import styled from "@emotion/styled";

const Divider = styled.div`
    width: 1px;
    margin: 0 5px;
    height: 100%;
    background-color: var(--mdc-theme-on-background);
`;

const topBar = css`
    box-shadow: 1px 0px 5px 0px rgba(128, 128, 128, 1);
`;

const LeftSection = makeComposable("LeftSection");

const RightSection = makeComposable("RightSection");

const HeaderComponent = makeComposable("Header", () => {
    return (
        <TopAppBar className={topBar} fixed data-testid={"cms-editor-top-bar"}>
            <TopAppBarSection style={{ width: "50%" }} alignStart>
                <LeftSection />
            </TopAppBarSection>
            <TopAppBarSection style={{ width: "50%" }} alignEnd>
                <RightSection />
            </TopAppBarSection>
        </TopAppBar>
    );
});

export type Header = React.FC & {
    Divider: typeof Divider;
    LeftSection: typeof LeftSection;
    RightSection: typeof RightSection;
};

export const Header: Header = Object.assign(HeaderComponent, {
    Divider,
    LeftSection,
    RightSection
});
