import React, { useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import {
    Heading,
    IconButton,
    OverlayLoader,
    Separator,
    SteppedProgress,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useWebsockets, type IncomingGenericData } from "@webiny/app-websockets";
import { ReactComponent as ArrowBackIcon } from "@webiny/icons/arrow_back.svg";
import { RunViewFeature } from "../feature.js";
import { StageList } from "./StageList.js";
import { ArtifactPanel } from "./ArtifactPanel.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { progressStateOf } from "~/shared/ledger.js";
import {
    STAGES,
    STAGE_DONE_ACTION,
    STAGE_FAILED_ACTION,
    STAGE_LABELS,
    STAGE_PROGRESS_ACTION
} from "~/constants.js";
import { Routes } from "~/routes.js";

/** The stage-progress websocket payload the runner sends; only `runId` is needed to filter. */
interface StageEvent extends IncomingGenericData {
    data?: { runId?: string };
}

const RunViewInner = createReactiveComponent(function RunViewInner() {
    const { presenter } = useFeature(RunViewFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Run);
    const websockets = useWebsockets();

    const runId = route ? route.params.runId : undefined;

    useEffect(() => {
        if (runId) {
            presenter.init(runId);
        }
    }, [presenter, runId]);

    // Live progress. A dropped message is caught by the poll below.
    useEffect(() => {
        const onEvent = (event: StageEvent) => {
            if (event.data?.runId === runId) {
                void presenter.refresh();
            }
        };
        const subs = [STAGE_PROGRESS_ACTION, STAGE_DONE_ACTION, STAGE_FAILED_ACTION].map(action =>
            websockets.onMessage<StageEvent>(action, onEvent)
        );
        return () => subs.forEach(sub => sub.off());
    }, [presenter, runId, websockets]);

    // Poll fallback while a stage is running.
    useEffect(() => {
        const interval = setInterval(() => {
            const run = presenter.vm.run;
            const running = run ? run.stages.some(stage => stage.status === "running") : false;
            if (running) {
                void presenter.refresh();
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [presenter]);

    const { vm } = presenter;
    const run = vm.run;

    const items = useMemo(() => {
        if (!run) {
            return STAGES.map(stage => ({ id: stage, label: STAGE_LABELS[stage] }));
        }
        return STAGES.map(stage => {
            const entry = run.stages.find(candidate => candidate.stage === stage);
            const { state, errored } = progressStateOf(entry?.status);
            return { id: stage, label: STAGE_LABELS[stage], state, errored };
        });
    }, [run]);

    if (vm.loading && !run) {
        return <OverlayLoader text="Loading run..." />;
    }

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center gap-sm py-xs px-md">
                <IconButton
                    icon={<ArrowBackIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => goToRoute(Routes.List)}
                    aria-label="Back to extractions"
                />
                <div className="flex flex-col min-w-0">
                    <Heading level={6}>
                        {vm.job ? vm.job.name : "Extraction"}
                        {run ? ` — run ${run.runNumber}` : ""}
                    </Heading>
                    {run ? (
                        <Text size="sm" className="text-neutral-strong">
                            {run.counts.pages} pages · {run.counts.sections} sections ·{" "}
                            {run.counts.clusters} clusters · {run.counts.components} components ·
                            started <TimeAgo datetime={run.createdOn} />
                        </Text>
                    ) : null}
                </div>
            </div>
            <Separator />

            {vm.error ? (
                <div className="px-md py-sm border-b border-destructive-dimmed bg-destructive-subtle">
                    <Text size="sm" className="text-destructive-default">
                        {vm.error}
                    </Text>
                </div>
            ) : null}

            <div className="flex flex-1 min-h-0">
                <div className="w-[300px] flex-shrink-0 border-r border-neutral-dimmed overflow-y-auto">
                    <div className="px-md py-sm">
                        <SteppedProgress items={items} />
                    </div>
                    <Separator />
                    <StageList presenter={presenter} />
                </div>
                <div className="flex-1 min-w-0">
                    <ArtifactPanel presenter={presenter} />
                </div>
            </div>
        </div>
    );
});

export const RunViewPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        RunViewFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RunViewInner />
        </DiContainerProvider>
    );
};
