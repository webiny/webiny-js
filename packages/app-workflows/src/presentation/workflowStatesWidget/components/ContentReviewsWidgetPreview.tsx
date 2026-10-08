import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { Card } from "@webiny/admin-ui";
import { Tabs } from "@webiny/admin-ui";
import { Widget } from "@webiny/admin-ui";
import { ReactComponent as ReviewRequestsIcon } from "@webiny/icons/reviews.svg";

export interface ContentReviewsWidgetPreviewRow {
    title: string;
    description: string;
    color: string;
}

interface ContentReviewsWidgetPreviewProps {
    title: React.ReactNode;
    rows: ContentReviewsWidgetPreviewRow[];
}

/*
 * The Content Reviews card with sample entries, for the "Add widget" drawer. The real widget loads
 * workflow states, which the drawer must not do for a picture.
 */
export const ContentReviewsWidgetPreview = ({ title, rows }: ContentReviewsWidgetPreviewProps) => {
    const list = (
        <Accordion variant={"container"}>
            {rows.map(row => (
                <Accordion.Item
                    key={row.title}
                    title={row.title}
                    description={row.description}
                    colorMark={row.color}
                    open={false}
                    interactive={false}
                >
                    <></>
                </Accordion.Item>
            ))}
        </Accordion>
    );

    return (
        <Widget
            variant={"base"}
            outline={true}
            icon={
                <Card.Icon
                    icon={<ReviewRequestsIcon />}
                    label={"Review Requests"}
                    color={"accent"}
                />
            }
            title={title}
            headerActions={<Widget.Action>View All</Widget.Action>}
            bodyPadding={false}
        >
            <Tabs
                spacing={"lg"}
                separator={true}
                defaultValue={"pending"}
                tabs={[
                    <Tabs.Tab
                        key={"pending"}
                        value={"pending"}
                        trigger={`Pending (${rows.length})`}
                        content={list}
                    />,
                    <Tabs.Tab
                        key={"inReview"}
                        value={"inReview"}
                        trigger={"In Review (1)"}
                        content={null}
                    />,
                    <Tabs.Tab
                        key={"approved"}
                        value={"approved"}
                        trigger={"Approved (4)"}
                        content={null}
                    />,
                    <Tabs.Tab
                        key={"rejected"}
                        value={"rejected"}
                        trigger={"Rejected (0)"}
                        content={null}
                    />
                ]}
            />
        </Widget>
    );
};
