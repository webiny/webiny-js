import React from "react";
import { Icon, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import type { TimelineSentence } from "~/admin/timeline/summariseItem.js";

/**
 * What separates the three kinds of sentence, and the one thing on a row that is not text.
 *
 * Only a generated sentence takes it. That asymmetry is the whole signal: an exact record carries
 * no decoration, so there is nothing to interpret, and the one kind that can be wrong is the one a
 * reader's eye catches. Marking both would make the distinction invisible again, which is why the
 * mark is defined here and nowhere else.
 *
 * It trails the sentence rather than sitting in a gutter beside it. The design puts it in a 16px
 * gutter with the sentence indented 20px past the actor's name, and that indent read as wrong in
 * the running panel — every line under a name now begins at the name's own edge, so a row is one
 * left edge whatever kind of sentence it holds. Trailing is what keeps the mark without spending
 * an indent on the rows that have nothing to mark.
 */
export const SummaryMark = ({ summary }: { summary: TimelineSentence | null }) =>
    summary?.generated ? (
        <Tooltip
            content={"Written by AI from the values that changed. It can be wrong."}
            trigger={
                <Icon
                    size={"sm"}
                    label={"AI-generated"}
                    icon={<AutoAwesomeIcon />}
                    className={"ml-xxs inline-block align-text-bottom fill-primary-default"}
                />
            }
        />
    ) : null;
