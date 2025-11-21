import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/modules/pages/configs/index.js";
import { PagesListContentReviews } from "./PagesListContentReviews.js";

export const PageList = () => {
    return (
        <PageListConfig>
            <PagesListContentReviews />
        </PageListConfig>
    );
};
