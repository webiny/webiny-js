import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { PagesListContentReviews } from "./PagesListContentReviews.js";
import { PageListChangeStatus } from "./PageListChangeStatus.js";
import { UseDocumentListHookDecorator } from "./UseDocumentListHookDecorator.js";

export const PagesList = () => {
    return (
        <PageListConfig>
            {/* Attach the decorator for useDocumentList - need it to make pages with states unselectable */}
            <UseDocumentListHookDecorator />
            {/* Add a Content Reviews button to footer in sidebar  */}
            <PagesListContentReviews />
            {/* Decorate the Change Status action in row options to hide it for pages in certain workflow states */}
            <PageListChangeStatus />
        </PageListConfig>
    );
};
