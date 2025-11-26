import React from "react";
import { Widget, List, Link, Text } from "@webiny/admin-ui";
import { ReactComponent as HelpIcon } from "@webiny/icons/help_outline.svg";
import { ReactComponent as ArrowForwardIcon } from "@webiny/icons/arrow_forward.svg";
import { SimpleLink } from "@webiny/app-admin";

export const AssistanceWidget = () => {
    return (
        <Widget
            variant="light"
            title="Need some assistance?"
            icon={<Widget.Icon icon={<HelpIcon />} label={"Need some assistance?"} />}
            padding="md"
        >
            <List variant="container" className="flex flex-col gap-y-sm">
                <List.Item
                    title="Documentation"
                    description="Explore the Webiny documentation and check out code examples and guides."
                    actions={
                        <>
                            <SimpleLink
                                to="https://www.webiny.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <List.Item.Action icon={<ArrowForwardIcon />} />
                            </SimpleLink>
                        </>
                    }
                />
                <List.Item
                    title="Contact us"
                    description={
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            <Link
                                to={"https://www.webiny.com/forms/product-demo"}
                                target={"_blank"}
                                rel={"noopener noreferrer"}
                                variant={"secondary"}
                                underline
                            >
                                Contact Sales
                            </Link>
                            ,{" "}
                            <Link
                                to={"https://www.webiny.com/partners"}
                                target={"_blank"}
                                rel={"noopener noreferrer"}
                                variant={"secondary"}
                                underline
                            >
                                Explore Partnerships
                            </Link>{" "}
                            or{" "}
                            <Link
                                to={"https://www.webiny.com/slack"}
                                target={"_blank"}
                                rel={"noopener noreferrer"}
                                variant={"secondary"}
                                underline
                            >
                                Slack us
                            </Link>
                            .
                        </Text>
                    }
                />
            </List>
        </Widget>
    );
};
