import React, { useEffect, useState } from "react";
import { Button, Input, Text } from "@webiny/admin-ui";
import type { RunViewPresenter } from "../abstractions.js";

interface Props {
    presenter: RunViewPresenter.Interface;
    /** What the last Segment run actually used, read off its artifact. */
    current: number;
    disabled: boolean;
}

const MIN = 100;
const MAX = 5000;

/**
 * The section-container height, editable per run.
 *
 * A block taller than this that is a vertical stack of full-width children is read as a container and
 * split into them; a shorter one is kept whole. It is the single number that decides whether two
 * logical blocks stay merged — measured across two sites, every under-split section was held together
 * by this gate and by nothing else — so it is tuned here rather than in the source, and a re-run at a
 * different value is the evidence for the next tuning pass.
 */
export const SegmentHeightControl = ({ presenter, current, disabled }: Props) => {
    const [value, setValue] = useState(String(current));

    // Follow the run when it changes underneath — a re-run, or another stage's artifact loading.
    useEffect(() => {
        setValue(String(current));
    }, [current]);

    const parsed = Number(value);
    const valid = Number.isFinite(parsed) && parsed >= MIN && parsed <= MAX;
    const changed = valid && parsed !== current;

    return (
        <div className="flex flex-col gap-xxs">
            <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
                container height
            </Text>
            <div className="flex items-center gap-sm">
                <div className="w-28">
                    <Input
                        size="md"
                        value={value}
                        disabled={disabled}
                        onChange={(next: string) => setValue(next)}
                    />
                </div>
                <Text size="sm" className="text-neutral-strong">
                    px
                </Text>
                <Button
                    variant="secondary"
                    size="sm"
                    text="Re-segment"
                    disabled={disabled || !changed}
                    onClick={() => void presenter.applySegmentMaxHeight(parsed)}
                />
            </div>
            <Text size="sm" className="text-neutral-strong">
                A stacked block taller than this is split into its children. Lower splits more.
                Changing it re-runs Segment and marks everything after it stale.
            </Text>
        </div>
    );
};
