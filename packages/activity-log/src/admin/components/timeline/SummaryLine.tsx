import React from "react";
import { cn, Text } from "@webiny/admin-ui";
import type { TimelineSentence } from "~/admin/timeline/summariseItem.js";
import { TYPE } from "../typeScale.js";
import { SummaryMark } from "./SummaryMark.js";

/**
 * The sentence itself, one step back in weight for the third kind.
 *
 * That step is what tells a field-name description from an exact one without putting a label on
 * either: an exact record reads at full strength, and a restatement of the chips below it does not
 * need to.
 */
export const SummaryLine = ({ summary }: { summary: TimelineSentence }) => (
    <Text
        as={"div"}
        className={cn(
            TYPE.sentence,
            "text-wrap-pretty",
            summary.kind === "fields" ? "text-neutral-strong" : "text-neutral-primary"
        )}
    >
        {summary.segments.map((segment, index) => {
            if (segment.kind === "field") {
                // A field name carries weight, because it is the thing a reader is scanning for.
                // No colour: it belongs to the sentence rather than standing outside it.
                return (
                    <span key={index} className={"font-semibold"}>
                        {segment.text}
                    </span>
                );
            }

            if (segment.kind === "value") {
                // Content, marked the way content is marked everywhere else in this panel — the
                // same treatment as a field chip — so a reader learns one thing once. Without it
                // "from Now I like the new description to Now I like the new description, it is
                // really great" has no visible seam.
                return (
                    <span
                        key={index}
                        className={
                            "mx-[1px] rounded-xs bg-neutral-light px-xxs text-neutral-primary"
                        }
                    >
                        {segment.text}
                    </span>
                );
            }

            return <React.Fragment key={index}>{segment.text}</React.Fragment>;
        })}
        <SummaryMark summary={summary} />
    </Text>
);
