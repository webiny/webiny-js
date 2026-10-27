import React from "react";
import { Accordion, cn, Tag, Text } from "@webiny/admin-ui";
import { describeAction } from "~/admin/timeline/describeAction.js";
import { describeActor } from "~/admin/timeline/describeActor.js";
import { summariseItem } from "~/admin/timeline/summariseItem.js";
import type { TimelineItem } from "~/admin/timeline/collapseConsecutive.js";
import { TYPE } from "../typeScale.js";
import { ActorAvatar } from "./ActorAvatar.js";
import { PendingNote } from "./PendingNote.js";
import { RowTime } from "./RowTime.js";
import { SaveDisclosure } from "./SaveDisclosure.js";
import { SummaryLine } from "./SummaryLine.js";
import { ViaNote } from "./ViaNote.js";

/** One save, collapsed to a sentence and openable to its fields. */
export const SaveRow = ({ item }: { item: TimelineItem }) => {
    const summary = summariseItem(item);
    const action = describeAction(item);
    const actor = describeActor({ actor: item.latest.actor, source: item.latest.source });
    const expandable = summary.changedFieldCount > 0;

    return (
        <div>
            <Accordion background={"transparent"}>
                <Accordion.Item
                    // The hover overlay belongs on a list of actions. This is a history, every row
                    // opens, and a wash moving under the cursor down a long timeline is motion
                    // without meaning.
                    className={"before:hidden hover:before:bg-transparent"}
                    interactive={expandable}
                    icon={
                        <ActorAvatar
                            kind={actor.kind}
                            initials={actor.initials}
                            machineIcon={actor.machineIcon}
                            name={actor.name}
                        />
                    }
                    // The action badge used to sit between the name and the sentence, which pushed
                    // the sentence right on the rows that had one — "Created" starting at a
                    // different x than "made 6 saves" directly above it. It also said the same
                    // thing twice: the badge read "Created" and the sentence beside it read
                    // "created this entry". The actor badge stays, because "API" is not in the
                    // sentence anywhere.
                    /*
                      Name and sentence in one block, and `subtitle` deliberately unused.

                      `AccordionTrigger` renders title and subtitle as two children of a
                      `flex gap-xs` that does not wrap. Flex items shrink by default, so a long
                      sentence squeezed the title until the *name* broke across two lines while the
                      sentence beside it started fresh — two stacked fragments where there should be
                      one line of prose.

                      Handing it a single child removes the thing that was being squeezed, so the
                      text wraps as a sentence. It also keeps this row independent of that
                      component's internal class names, which the first attempt at a fix depended
                      on and got wrong.
                    */
                    title={
                        <span className={cn(TYPE.row, "font-normal")}>
                            <span className={"font-semibold"}>{actor.name}</span>
                            {actor.badge ? (
                                <>
                                    {" "}
                                    <Tag
                                        className={"align-middle"}
                                        variant={"neutral-light"}
                                        content={actor.badge}
                                    />
                                </>
                            ) : null}{" "}
                            <span className={"text-neutral-muted"}>{action.sentence}</span>
                        </span>
                    }
                    description={
                        <>
                            {/*
                              Two shapes, and they have to sit together in a list without the
                              shorter one reading as unfinished. A row that is one run carries that
                              run's sentence; a row of several carries the fields it touched
                              instead. Both keep the same left edge and the same last line, so the
                              difference reads as quiet rather than as missing.
                            */}
                            {summary.summary ? <SummaryLine summary={summary.summary} /> : null}
                            {summary.summaryPending ? <PendingNote /> : null}
                            {!summary.summary && !summary.summaryPending && summary.fieldsLine ? (
                                <Text
                                    as={"div"}
                                    className={cn(
                                        TYPE.field,
                                        "text-wrap-pretty text-neutral-strong"
                                    )}
                                >
                                    {summary.fieldsLine}
                                </Text>
                            ) : null}
                            <RowTime
                                timestamp={summary.latestTimestamp}
                                from={summary.spansTime ? summary.earliestTimestamp : undefined}
                            />
                            {summary.subjectLabel ? (
                                <div className={TYPE.field}>
                                    {`Step: ${summary.subjectLabel}`}
                                    {summary.hasNote ? " — a note was left" : ""}
                                </div>
                            ) : null}
                            {actor.via ? <ViaNote text={actor.via} /> : null}
                        </>
                    }
                >
                    {expandable ? <SaveDisclosure item={item} /> : <span />}
                </Accordion.Item>
            </Accordion>
        </div>
    );
};
