import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { TYPE } from "../typeScale.js";
import { formatTimestamp, isValidTimestamp } from "./formatTime.js";

/**
 * How long ago, with the exact time on hover — the way a comment is timestamped.
 *
 * It used to print both, and on a collapsed run it printed three: the absolute time, the relative
 * time, and the absolute time the run started. Three clocks on a row whose subject is "what
 * changed" is a lot of furniture for a question most readers are not asking, and it put a line of
 * digits where comments put two words. The exact times are still here, in `title`, which is where
 * the comments panel keeps its own.
 *
 * `from` is the first write of a collapsed run. When it differs, the hover reads as a span rather
 * than an instant, because that is what the row covers.
 */
export const RowTime = ({ timestamp, from }: { timestamp: string; from?: string }) => {
    if (!isValidTimestamp(timestamp)) {
        return <span>{timestamp}</span>;
    }

    const exact =
        from && from !== timestamp && isValidTimestamp(from)
            ? `${formatTimestamp(from)} — ${formatTimestamp(timestamp)}`
            : formatTimestamp(timestamp);

    return <TimeAgo className={TYPE.time} datetime={timestamp} title={exact} />;
};
