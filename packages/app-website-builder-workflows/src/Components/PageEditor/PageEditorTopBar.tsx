import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageReviewBar } from "./PageReviewBar.js";

const { Ui } = PageEditorConfig;

export const PageEditorTopBar = Ui.TopBar.Layout.createDecorator(Original => {
    return function PageEditorTopBarReview() {
        return (
            <>
                <Original />
                <PageReviewBar />
            </>
        );
    };
});
