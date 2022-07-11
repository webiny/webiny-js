import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { ComposableFC, makeComposable } from "@webiny/app-admin";

const topBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)"
});

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

const LeftSection = makeComposable("LeftSection", ({ children }) => {
    return (
        <TopAppBarSection style={{ width: "33%" }} alignStart>
            <BackButton />
            <Divider />
            {children}
        </TopAppBarSection>
    );
});

const CenterSection = makeComposable("CenterSection", ({ children }) => {
    return <TopAppBarSection className={centerTopBar}>{children}</TopAppBarSection>;
});

const RightSection = makeComposable("RightSection", ({ children }) => {
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
const BackButton = makeComposable("BackButton");

/**
 * A generic divider for UI elements in the EditorBar.
 */
const Divider = makeComposable("Divider", () => {
    return <DividerRenderer />;
});

const DividerRenderer = makeComposable("DividerRenderer", () => {
    return <StyledDivider />;
});

type EditorBar = ComposableFC & {
    LeftSection: ComposableFC;
    CenterSection: ComposableFC;
    RightSection: ComposableFC;
    BackButton: ComposableFC;
    Divider: ComposableFC;
};

const ComposableEditorBar = makeComposable("EditorBar", () => {
    return <EditorBarRenderer />;
});

export const EditorBarRenderer = makeComposable("EditorBarRenderer", () => {
    return (
        <TopAppBar className={topBar} fixed>
            <LeftSection />
            <CenterSection />
            <RightSection />
        </TopAppBar>
    );
});

export const EditorBar: EditorBar = Object.assign(ComposableEditorBar, {
    LeftSection,
    CenterSection,
    RightSection,
    BackButton,
    Divider
});
