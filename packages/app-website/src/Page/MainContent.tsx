import { makeDecoratable } from "@webiny/app";
import { Page, PageProps } from "@webiny/app-page-builder-elements";
import React from "react";

type MainContentProps = Omit<PageProps, "layout" | "layoutProps">;

export const MainContent = makeDecoratable("MainContent", (props: MainContentProps) => {
    return <Page {...props} />;
});
