import React from "react";
import { css } from "emotion";
import { makeDecoratable } from "@webiny/app-admin";
import { TopAppBar, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { TopBar } from "./TopBar";

const topBar = css`
    box-shadow: 1px 0px 5px 0px rgba(128, 128, 128, 1);
    height: 64px;
    display: flex;
    > * {
        flex: 1;
    }
`;

const centerTopBar = css`
    &.mdc-top-app-bar__section {
        padding-top: 0;
        padding-bottom: 0;
    }
`;

const oneThird = { width: "33%" };

export interface TopBarLayoutProps {
    fixed?: boolean;
    className?: string;
}

export const Layout = makeDecoratable("TopBarLayout", (props: TopBarLayoutProps) => {
    return (
        <TopAppBar className={props.className ?? topBar} fixed={props.fixed ?? true}>
            <TopAppBarSection alignStart style={oneThird}>
                <TopBar.Elements group={"left"} />
            </TopAppBarSection>
            <TopAppBarSection className={centerTopBar} style={oneThird}>
                <TopBar.Elements group={"center"} />
            </TopAppBarSection>
            <TopAppBarSection alignEnd style={oneThird}>
                <TopBar.Elements group={"actions"} />
            </TopAppBarSection>
        </TopAppBar>
    );
});
