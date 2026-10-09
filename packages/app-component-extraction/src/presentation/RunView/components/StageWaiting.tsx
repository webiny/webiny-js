import React, { useEffect, useState } from "react";
import { Loader, ProgressBar, Text } from "@webiny/admin-ui";
import type { Stage } from "~/constants.js";
import type { StageProgress } from "~/shared/types.js";
import { formatElapsed, WAITING_SENTENCES } from "~/shared/waiting.js";

/**
 * What a running stage is doing, in place of its raw log (waiting-screens-plan.md): one plain sentence,
 * the stage's own count as a bar, its latest message, and how long it has been running.
 *
 * No time estimate. Replayed on two runs, a pace-based estimate was within two minutes on one and 20 to
 * 33 minutes short on the other, where one silent component held Generate for 20 minutes after the rest
 * had settled. So Generate says which component is still working, and for how long, instead.
 */
interface Props {
    stage: Stage;
    startedOn: string | null;
    progress: StageProgress | undefined;
}

const useNow = () => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    return now;
};

export const StageWaiting = ({ stage, startedOn, progress }: Props) => {
    const now = useNow();
    const elapsed = startedOn ? (now - new Date(startedOn).getTime()) / 1000 : null;
    const counted = progress && progress.total > 0;
    const generate = progress?.data?.generate;

    return (
        <div className="flex flex-col gap-md rounded-md border border-neutral-dimmed p-md">
            <div className="flex items-center gap-sm">
                <Loader size="sm" />
                <Text className="font-medium">{WAITING_SENTENCES[stage]}</Text>
            </div>

            {counted ? (
                <div className="flex flex-col gap-xxs">
                    <ProgressBar
                        value={progress.current}
                        max={progress.total}
                        valuePosition="end"
                    />
                    <Text size="sm" className="text-neutral-strong">
                        {progress.current} of {progress.total}
                        {progress.message ? ` · ${progress.message}` : ""}
                    </Text>
                </div>
            ) : progress?.message ? (
                <Text size="sm" className="text-neutral-strong">
                    {progress.message}
                </Text>
            ) : null}

            {generate ? (
                <div className="flex flex-col gap-xs">
                    <div className="grid grid-cols-4 gap-sm">
                        {[
                            ["Passed", generate.passed],
                            ["Did not pass", generate.notPassed],
                            ["Working", generate.working],
                            ["Waiting", generate.waiting]
                        ].map(([label, value]) => (
                            <div key={label} className="flex flex-col">
                                <Text className="text-xl font-semibold">{value}</Text>
                                <Text size="sm" className="text-neutral-muted">
                                    {label}
                                </Text>
                            </div>
                        ))}
                    </div>
                    {generate.longestWorking ? (
                        <Text size="sm" className="text-neutral-strong">
                            {generate.working === 1
                                ? "1 component still working"
                                : `${generate.working} components working; the longest`}
                            : {generate.longestWorking.name},{" "}
                            {formatElapsed(generate.longestWorking.seconds)}
                            {generate.longestWorking.retrying
                                ? " (retrying: it stopped answering and was started again)"
                                : ""}
                            .
                        </Text>
                    ) : null}
                    <Text size="sm" className="text-neutral-muted">
                        &quot;Did not pass&quot; counts components that used up their attempts; a
                        component that fails an attempt and is still working is not counted.
                    </Text>
                </div>
            ) : null}

            {elapsed !== null ? (
                <Text size="sm" className="text-neutral-muted">
                    Running for {formatElapsed(elapsed)}. Safe to leave: the run continues in the
                    background.
                </Text>
            ) : null}
        </div>
    );
};
