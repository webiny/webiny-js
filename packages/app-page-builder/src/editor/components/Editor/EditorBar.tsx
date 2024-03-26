import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { TopAppBarSection } from "@webiny/ui/TopAppBar";
import { createVoidComponent, makeDecoratable } from "@webiny/app-admin";

const centerTopBar = css({
    "&.mdc-top-app-bar__section": {
        paddingTop: 0,
        paddingBottom: 0
    }
});

const StyledDivider = styled("div")({
    width: 1,
    margin: "0 5px",
    height: "100%",
    backgroundColor: "var(--mdc-theme-on-background)"
});

const LeftSection = makeDecoratable("LeftSection", ({ children }) => {
    return (
        <TopAppBarSection style={{ width: "33%" }} alignStart>
            <BackButton />
            <Divider />
            {children}
        </TopAppBarSection>
    );
});

const CenterSection = makeDecoratable("CenterSection", ({ children }) => {
    return <TopAppBarSection className={centerTopBar}>{children}</TopAppBarSection>;
});

const RightSection = makeDecoratable("RightSection", ({ children }) => {
    return (
        <TopAppBarSection style={{ width: "33%" }} alignEnd>
            {children}
        </TopAppBarSection>
    );
});

/**
 * This component serves as a placeholder for other editors to implement how they see fit.
 * A Page editor will redirect back to the pages list; a Block editor will redirect back to blocks list, etc.
 */
const BackButton = makeDecoratable("BackButton", createVoidComponent());

/**
 * A generic divider for UI elements in the EditorBar.
 */
const Divider = makeDecoratable("Divider", () => {
    return <DividerRenderer />;
});

const DividerRenderer = makeDecoratable("DividerRenderer", () => {
    return <StyledDivider />;
});

export const EditorBar = Object.assign(
    {},
    {
        LeftSection,
        CenterSection,
        RightSection,
        BackButton,
        Divider
    }
);
