import React from "react";
import { css } from "emotion";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { makeComposable } from "@webiny/app-admin";

const topBar = css`
    box-shadow: 1px 0px 5px 0px rgba(128, 128, 128, 1);
`;

export const LeftSection = makeComposable("LeftSection", ({ children }) => {
    return (
        <TopAppBarSection style={{ width: "50%" }} alignStart>
            {children}
        </TopAppBarSection>
    );
});

export const RightSection = makeComposable("RightSection", ({ children }) => {
    return (
        <TopAppBarSection style={{ width: "50%" }} alignEnd>
            {children}
        </TopAppBarSection>
    );
});

const HeaderComponent = makeComposable("Header", () => {
    return (
        <TopAppBar className={topBar} fixed data-testid={"cms-editor-top-bar"}>
            <LeftSection />
            <RightSection />
        </TopAppBar>
    );
});

export type Header = React.FC & {
    LeftSection: typeof LeftSection;
    RightSection: typeof RightSection;
};

export const Header: Header = Object.assign(HeaderComponent, {
    LeftSection,
    RightSection
});
