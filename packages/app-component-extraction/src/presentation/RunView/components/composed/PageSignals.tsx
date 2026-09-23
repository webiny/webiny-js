import React from "react";
import { Text } from "@webiny/admin-ui";
import type { PageSignalsDto } from "~/shared/types.js";
import { caveatReasons, textCoverage } from "./pageStatus.js";

interface Props {
    signals?: PageSignalsDto;
}

const Signal = ({
    label,
    value,
    detail,
    concerning
}: {
    label: string;
    value: string;
    detail?: string;
    concerning?: boolean;
}) => (
    <div className="flex min-w-0 flex-col gap-xxs">
        <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
            {label}
        </Text>
        <Text className={concerning ? "font-medium text-warning" : "font-medium"}>{value}</Text>
        {detail ? (
            <Text size="sm" className="text-neutral-strong">
                {detail}
            </Text>
        ) : null}
    </div>
);

/**
 * The four fidelity signals for one page (§4).
 *
 * There is no similarity score here and there should not be one. A whole-page number is worse than
 * the component-level indicator it would be modelled on: heights differ, fonts load differently, and
 * a single missing section shifts everything below it, so a page that migrated well reads 0.62 and
 * an operator learns nothing they can act on. Each of these four points at a specific thing to check.
 */
export const PageSignals = ({ signals }: Props) => {
    if (!signals) {
        return (
            <Text size="sm" className="text-neutral-strong">
                This page was composed before the fidelity signals shipped. Re-compose the run to
                measure it.
            </Text>
        );
    }

    const coverage = textCoverage(signals);
    const reasons = caveatReasons(signals);

    return (
        <div className="flex flex-col gap-sm">
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
                <Signal
                    label="Sections / composed"
                    value={`${signals.sourceSections} → ${signals.composedInstances}`}
                    detail={
                        signals.assembledInstances !== signals.composedInstances
                            ? `${signals.assembledInstances} assembled`
                            : undefined
                    }
                    concerning={signals.composedInstances < signals.sourceSections}
                />
                <Signal
                    label="Text coverage"
                    value={
                        coverage === null
                            ? "no text"
                            : `${Math.round(coverage * 100)}% of ${signals.textTotal}`
                    }
                    concerning={coverage !== null && coverage < 0.9}
                />
                <Signal
                    label="Destinations"
                    value={`${signals.links.rewritten} rewritten`}
                    detail={`${signals.links.external} external · ${signals.links.recovered} recovered · ${signals.links.dropped} dropped`}
                    concerning={signals.links.dropped > signals.links.recovered}
                />
                <Signal
                    label="Unplaced sections"
                    value={String(signals.unplaced.length)}
                    detail={
                        signals.unplaced.length > 0
                            ? "no promoted component matched"
                            : "every section became a component"
                    }
                    concerning={signals.unplaced.length > 0}
                />
            </div>

            {(signals.textMissingSample ?? []).length > 0 ? (
                <div className="flex flex-col gap-xxs">
                    <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
                        Not found on the composed page
                    </Text>
                    {/* What is missing, not just how much: a proportion tells an operator to worry,
                        these tell them where to look. */}
                    <div className="flex flex-wrap gap-xxs">
                        {(signals.textMissingSample ?? []).map((text, index) => (
                            <Text
                                key={`${text}-${index}`}
                                size="sm"
                                className="rounded-sm bg-neutral-light px-xs py-xxs font-mono text-neutral-strong"
                            >
                                {text}
                            </Text>
                        ))}
                        {signals.textTotal - signals.textPresent >
                        (signals.textMissingSample ?? []).length ? (
                            <Text size="sm" className="px-xs py-xxs text-neutral-strong">
                                and{" "}
                                {signals.textTotal -
                                    signals.textPresent -
                                    (signals.textMissingSample ?? []).length}{" "}
                                more
                            </Text>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {reasons.length > 0 ? (
                <div className="flex flex-col gap-xxs rounded-sm border border-warning bg-warning-subtle p-sm">
                    {reasons.map(reason => (
                        <Text key={reason} size="sm">
                            {reason}
                        </Text>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
