import React from "react";
import { Heading, Icon, Link as AdminLink, Text } from "@webiny/admin-ui";
import { ReactComponent as HelpIcon } from "@webiny/icons/help_outline.svg";
import { SimpleLink } from "@webiny/app-admin";

export const AssistanceWidget = () => {
    return (
        <div className={"bg-neutral-light rounded-xl p-lg"}>
            <div className={"flex items-center gap-sm mb-md"}>
                <Icon
                    icon={<HelpIcon />}
                    label={"Need some assistance?"}
                    size={"md"}
                    color={"accent"}
                />
                <Heading level={6}>{"Need some assistance?"}</Heading>
            </div>
            <div className={"bg-neutral-base rounded-sm px-md py-sm-extra mb-md"}>
                <SimpleLink
                    to="https://www.webiny.com/docs"
                    target={"_blank"}
                    rel={"noopener noreferrer"}
                    className={"no-underline!"}
                >
                    <Text as={"div"} className={"font-semibold text-neutral-primary!"}>
                        {"Documentation"}
                    </Text>
                    <Text size={"sm"} className={"text-neutral-strong!"}>
                        {"Explore the Webiny documentation and check out code examples and guides."}
                    </Text>
                </SimpleLink>
            </div>

            <div className={"bg-neutral-base rounded-sm px-md py-sm-extra"}>
                <Text as={"div"} className={"font-semibold"}>
                    {"Contact us"}
                </Text>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    <AdminLink
                        to={"https://www.webiny.com/forms/product-demo"}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        variant={"secondary"}
                        underline
                    >
                        Contact Sales
                    </AdminLink>
                    ,{" "}
                    <AdminLink
                        to={"https://www.webiny.com/partners"}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        variant={"secondary"}
                        underline
                    >
                        Explore Partnerships
                    </AdminLink>{" "}
                    or{" "}
                    <AdminLink
                        to={"https://www.webiny.com/slack"}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        variant={"secondary"}
                        underline
                    >
                        Slack us
                    </AdminLink>
                    .
                </Text>
            </div>
        </div>
    );
};
