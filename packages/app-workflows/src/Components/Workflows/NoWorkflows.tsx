import React from "react";
import { Heading, Text } from "@webiny/admin-ui";
import { ReactComponent as EmptyStateIllustration } from "./EmptyStateIllustration.svg";

export const NoWorkflows = () => {
    return (
        <div className={"flex justify-center items-center flex-col py-xxl text-center"}>
            <Heading level={3}>Publishing Workflows</Heading>
            <EmptyStateIllustration className={"my-xl"} />
            <p className={"mb-md"}>There are no existing workflows.</p>
            <p>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    Learn more about{" "}
                    <a target={"_blank"} rel="noreferrer" href={"#"}>
                        what are publishing workflows
                    </a>{" "}
                    and <br />
                    <a target={"_blank"} rel="noreferrer" href={"#"}>
                        how to create them
                    </a>
                    .
                </Text>
            </p>
        </div>
    );
};
