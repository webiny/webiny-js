import React from "react";
import { Avatar } from "@webiny/admin-ui";
import { Card } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as GroupsIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingResultProps {
    result: TestRoutingResultVm;
    // The result no longer matches the configuration: the stale notice above it says so (R300).
    stale: boolean;
}

const TAG_VARIANTS = {
    Matched: "success-light",
    "Not matched": "neutral-muted",
    Skipped: "warning"
} as const;

// The result card of the Test routing tab (design README 4, R301). Every text arrives composed.
export const TestRoutingResult = ({ result, stale }: TestRoutingResultProps) => {
    const ownerIcon = result.ownerIcon === "groups" ? <GroupsIcon /> : <PersonIcon />;

    return (
        <div data-testid={"test-routing-result"} data-stale={String(stale)}>
            <Card padding={"sm"}>
                <div data-testid={"test-routing-owner-band"} className={"flex items-center gap-md"}>
                    <Avatar
                        data-testid={"test-routing-owner-icon"}
                        data-owner-icon={result.ownerIcon}
                        variant={"light"}
                        fallback={<Avatar.Fallback>{ownerIcon}</Avatar.Fallback>}
                    />
                    <div className={"flex flex-col"}>
                        <Text as={"div"} size={"sm"}>
                            {TEST_ROUTING_TAB_MESSAGES.owner}
                        </Text>
                        <Heading level={5}>{result.ownerLabel}</Heading>
                        <Text as={"div"} size={"sm"}>
                            {result.reason}
                        </Text>
                    </div>
                </div>
                <Separator margin={"xl"} />
                <Heading level={6}>{TEST_ROUTING_TAB_MESSAGES.trace}</Heading>
                {result.trace.length === 0 && (
                    <Text as={"div"} size={"sm"}>
                        {TEST_ROUTING_TAB_MESSAGES.noRules}
                    </Text>
                )}
                <List>
                    {result.trace.map((row, index) => (
                        <List.Item
                            key={`${row.ruleId}:${index}`}
                            data-testid={`test-routing-trace-${index}`}
                            icon={<Tag variant={TAG_VARIANTS[row.tag]} content={row.tag} />}
                            title={row.label}
                            description={row.reason}
                        />
                    ))}
                    <List.Item
                        data-testid={"test-routing-strategy"}
                        icon={
                            <Tag
                                variant={"neutral-base-outline"}
                                content={TEST_ROUTING_TAB_MESSAGES.strategy}
                            />
                        }
                        title={result.strategyLine}
                    />
                </List>
                {result.skipped.length > 0 && (
                    <>
                        <Separator margin={"xl"} />
                        <Heading level={6}>{TEST_ROUTING_TAB_MESSAGES.skippedPeople}</Heading>
                        <List>
                            {result.skipped.map((person, index) => (
                                <List.Item
                                    key={`${person.name}:${index}`}
                                    data-testid={`test-routing-skipped-${index}`}
                                    title={person.name}
                                    description={person.reason}
                                />
                            ))}
                        </List>
                    </>
                )}
            </Card>
        </div>
    );
};
