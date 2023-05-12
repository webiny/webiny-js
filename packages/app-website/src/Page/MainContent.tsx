import { makeComposable } from "@webiny/app";
import { Page, PageProps } from "@webiny/app-page-builder-elements";
import React from "react";

type MainContentProps = Omit<PageProps, "layout" | "layoutProps">;

export const MainContent = makeComposable<MainContentProps>("MainContent", props => {
    return <Page {...props} />;
});
