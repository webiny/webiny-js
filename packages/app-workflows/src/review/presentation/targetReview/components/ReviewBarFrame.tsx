import React from "react";
import { Card, Separator } from "@webiny/admin-ui";
import type { ReviewBarLayout } from "./ReviewBarLayout.js";

export interface ReviewBarFrameProps extends React.HTMLAttributes<HTMLDivElement> {
    layout: ReviewBarLayout;
}

/*
 * The review bar's frame: a card inside the content, or a full-width strip with a separator under
 * a top bar (UI-7). The rest props land on the element that holds the content.
 */
export const ReviewBarFrame = (props: ReviewBarFrameProps) => {
    const { layout, children, ...rest } = props;

    if (layout === "strip") {
        return (
            <>
                <div {...rest} className={"px-md py-sm-extra"}>
                    {children}
                </div>
                <Separator />
            </>
        );
    }

    return (
        <div className={"m-md"}>
            <Card padding={"sm"} cornerSize={"md"} elevation={"small"}>
                <div {...rest} className={"pt-md"}>
                    {children}
                </div>
            </Card>
        </div>
    );
};
