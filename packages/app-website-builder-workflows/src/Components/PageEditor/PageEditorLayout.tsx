import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageReadOnlySync } from "./PageReadOnlySync.js";

const { Ui } = PageEditorConfig;

export const PageEditorLayout = Ui.Layout.createDecorator(Original => {
    return function PageEditorLayoutReview() {
        return (
            <>
                <Original />
                <PageReadOnlySync />
            </>
        );
    };
});
