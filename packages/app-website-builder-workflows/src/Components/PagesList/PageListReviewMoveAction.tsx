import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageMoveGate } from "./PageMoveGate.js";

const { Browser } = PageListConfig;

/*
 * The per-row "Move" is disabled while the page is in review. Moving by drag and drop and the bulk
 * move are not gated here (the CMS list gates only the row action too).
 */
export const PageListReviewMoveAction = Browser.Page.Action.createDecorator(Original => {
    return function PageListReviewMoveActionDecorator(props) {
        if (props.name !== "moveToFolder") {
            return <Original {...props} />;
        }

        return <Original {...props} element={<PageMoveGate element={props.element} />} />;
    };
});
