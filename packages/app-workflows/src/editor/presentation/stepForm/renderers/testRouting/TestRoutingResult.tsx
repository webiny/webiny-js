import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as GroupsIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingResultProps {
    result: TestRoutingResultVm;
    // The result no longer matches the configuration: shown at reduced emphasis (R300).
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
    const cardClass = cn(
        "overflow-hidden rounded-lg border-sm border-neutral-muted bg-neutral-base",
        stale && "opacity-50"
    );
    const headingClass = "font-semibold uppercase tracking-wide text-neutral-strong";

    return (
        <div data-testid={"test-routing-result"} data-stale={String(stale)} className={cardClass}>
            <div
                data-testid={"test-routing-owner-band"}
                className={"flex items-center gap-md bg-neutral-subtle p-md"}
            >
                <span
                    data-testid={"test-routing-owner-icon"}
                    data-owner-icon={result.ownerIcon}
                    className={
                        "flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-dimmed text-neutral-strong"
                    }
                >
                    {ownerIcon}
                </span>
                <div className={"flex flex-col"}>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        {TEST_ROUTING_TAB_MESSAGES.owner}
                    </Text>
                    <Text as={"div"} size={"md"} className={"font-semibold"}>
                        {result.ownerLabel}
                    </Text>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        {result.reason}
                    </Text>
                </div>
            </div>
            <div className={"flex flex-col gap-sm p-md"}>
                <Text as={"div"} size={"sm"} className={headingClass}>
                    {TEST_ROUTING_TAB_MESSAGES.trace}
                </Text>
                {result.trace.length === 0 && (
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        {TEST_ROUTING_TAB_MESSAGES.noRules}
                    </Text>
                )}
                {result.trace.map((row, index) => (
                    <div
                        key={`${row.ruleId}:${index}`}
                        data-testid={`test-routing-trace-${index}`}
                        className={"grid grid-cols-[92px_1fr] items-start gap-sm"}
                    >
                        <div>
                            <Tag variant={TAG_VARIANTS[row.tag]} content={row.tag} />
                        </div>
                        <div className={"flex min-w-0 flex-col"}>
                            <Text as={"div"} size={"sm"}>
                                {row.label}
                            </Text>
                            <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                                {row.reason}
                            </Text>
                        </div>
                    </div>
                ))}
                <div
                    data-testid={"test-routing-strategy"}
                    className={
                        "grid grid-cols-[92px_1fr] items-center gap-sm border-t-sm border-neutral-muted pt-sm"
                    }
                >
                    <div>
                        <Tag
                            variant={"neutral-base-outline"}
                            content={TEST_ROUTING_TAB_MESSAGES.strategy}
                        />
                    </div>
                    <Text size={"sm"}>{result.strategyLine}</Text>
                </div>
            </div>
            {result.skipped.length > 0 && (
                <div className={"flex flex-col gap-xs border-t-sm border-neutral-muted p-md"}>
                    <Text as={"div"} size={"sm"} className={headingClass}>
                        {TEST_ROUTING_TAB_MESSAGES.skippedPeople}
                    </Text>
                    {result.skipped.map((person, index) => (
                        <Text
                            as={"div"}
                            size={"sm"}
                            key={`${person.name}:${index}`}
                            data-testid={`test-routing-skipped-${index}`}
                        >
                            <span className={"font-semibold"}>{person.name}</span>
                            {`: ${person.reason}`}
                        </Text>
                    ))}
                </div>
            )}
        </div>
    );
};
