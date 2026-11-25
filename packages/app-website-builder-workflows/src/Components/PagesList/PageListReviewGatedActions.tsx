import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PagePublishGate } from "./PagePublishGate.js";
import { PageScheduleGate } from "./PageScheduleGate.js";

const { Browser } = PageListConfig;

/*
 * Row actions that publish a page, which the API refuses without an approved review while a
 * workflow binds the pages: "Change status" offers "Publish" disabled with the reason
 * (`PagePublishGate`), the scheduler's "Schedule" (only present when the scheduler is installed)
 * is hidden (`PageScheduleGate`). Both are left alone on a published row ("Unpublish").
 */
export const PageListReviewGatedActions = Browser.Page.Action.createDecorator(Original => {
    return function PageListReviewGatedAction(props) {
        if (props.name === "changeStatus") {
            return <Original {...props} element={<PagePublishGate element={props.element} />} />;
        }
        if (props.name === "page-schedule") {
            return <Original {...props} element={<PageScheduleGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
