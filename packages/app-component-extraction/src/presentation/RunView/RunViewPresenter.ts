import { makeAutoObservable, runInAction } from "mobx";
import { RunViewPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import { stageEntry } from "~/shared/ledger.js";
import { normalizeUrl } from "~/shared/url.js";
import type {
    ComponentPromptDto,
    AssembleArtifactDto,
    DecisionsDto,
    GenerateArtifactDto,
    GeneratedComponentDetailDto,
    ModelCallDto,
    OverrideDto,
    PlanArtifactDto,
    PlanCostProjectionDto,
    ReattachmentDto,
    RenderArtifactDto,
    RunDto,
    StageProgress,
    CaptureArtifactDto
} from "~/shared/types.js";

// How long to hold the optimistic "starting" indication before giving up on it. A stage marks itself
// running within a few seconds of its task starting; if the ledger hasn't reflected the trigger by now
// the task did not take (e.g. it never ran), so drop the indication and show the real status rather than
// hang on "starting" forever.
// A component render is ~45s; five minutes covers a slow one plus a continuation, and bounds the
// wait on a task that failed before it could write a record.
const RENDER_STALL_TIMEOUT_MS = 5 * 60 * 1000;
const STARTING_TIMEOUT_MS = 30000;

class RunViewPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        run: null,
        job: null,
        error: null,
        selectedStage: null,
        actionStage: null,
        progressByStage: {},
        logs: [],
        logsLoading: false,
        logsStage: null,
        artifact: null,
        artifactStage: null,
        artifactLoading: false,
        renders: null,
        rendering: false,
        renderingSignatures: [],
        decisions: {},
        sourceCrops: {},
        regenerating: [],
        planRegenerating: [],
        showTokens: false,
        modelCalls: null,
        modelCallsLoading: false,
        planProjection: null,
        overrides: [],
        machineArtifact: null,
        machineArtifactStage: null,
        selectedClusters: [],
        clusterBusy: false,
        showOverrides: false,
        showComposed: false,
        pageMap: null,
        pageMapLoading: false,
        composedAssemble: null,
        composedCapture: null,
        websiteDomain: null,
        livePageByPath: {},
        composing: false,
        recapturing: false,
        comparedPath: null,
        reattachments: [],
        promoteComponents: [],
        libraryNames: []
    };

    /** The task id whose logs are currently loaded, so a re-run (new task id) triggers a reload. */
    private loadedLogsTaskId: string | null = null;

    /** Pre-refine source per signature, so a completed regenerate is detected when the source changes. */
    private regenerateBaseline: Record<string, number> = {};

    /** Pre-regenerate props fingerprint per signature, so a completed Plan regenerate is detected. */
    private planRegenerateBaseline: Record<string, string> = {};

    /** Task id of the stage the operator just triggered, to keep a "starting" indication until it runs. */
    private pendingActionTaskId: string | null = null;

    /** When the current "starting" indication began, so it can't hang if the task never progresses. */
    private pendingActionSince: number | null = null;

    /** `stage:stageVersion` of the loaded artifact, so a re-run to a new version refetches it. */
    private loadedArtifactKey: string | null = null;

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable(this);
    }

    async init(runId: string) {
        runInAction(() => {
            this.vm.loading = true;
            this.vm.error = null;
        });

        try {
            const run = await this.gateway.getRun(runId);
            const job = await this.gateway.getJob(run.jobId);
            // Open the most-recently-active stage: whatever is running, else the last stage that has
            // actually run (has a task id). This keeps a completed/running stage — and its activity
            // trail — in view across a reload, instead of jumping ahead to the next pending stage (which
            // has no logs and looks like the trail was lost).
            const running = run.stages.find(entry => entry.status === "running");
            const lastRun = [...run.stages].reverse().find(entry => entry.taskId);
            const selected = running?.stage ?? lastRun?.stage ?? run.stages[0]?.stage ?? null;
            runInAction(() => {
                this.vm.run = run;
                this.vm.job = job;
                this.vm.loading = false;
                // Nested in this action deliberately: MobX flushes once at the outer boundary, so
                // observers see the run, the stage and the artifact change together.
                this.openStage(selected);
            });
            if (selected) {
                await this.loadLogs(run, selected);
                await this.loadArtifact(run, selected);
            }
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
                this.vm.loading = false;
            });
        }
    }

    /**
     * Each in-flight per-component render, and the screenshot it had when the button was pressed.
     *
     * Not on the view model: nothing renders it, and it must survive the poll that reads it.
     */
    private readonly renderRefAtTrigger = new Map<string, { ref: string | null; since: number }>();

    async refresh() {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            const run = await this.gateway.getRun(runId);
            runInAction(() => {
                this.vm.run = run;
            });
            // Clear the "starting" indication once the triggered stage has picked up its task (the task
            // stamps its id and marks the stage running/failed). The task-id match also covers a stage
            // that ran to completion between polls, where "running" was never observed. And, so it can't
            // hang, drop it after a timeout — e.g. a re-run of a done stage whose task never ran keeps
            // the ledger at its old "done", which would otherwise leave "starting" stuck until reload.
            if (this.vm.actionStage) {
                const entry = stageEntry(run, this.vm.actionStage);
                const confirmed =
                    !!entry &&
                    ((this.pendingActionTaskId !== null &&
                        entry.taskId === this.pendingActionTaskId) ||
                        entry.status === "running" ||
                        entry.status === "failed");
                const timedOut =
                    this.pendingActionSince !== null &&
                    Date.now() - this.pendingActionSince > STARTING_TIMEOUT_MS;
                if (confirmed || timedOut) {
                    this.pendingActionTaskId = null;
                    this.pendingActionSince = null;
                    runInAction(() => {
                        this.vm.actionStage = null;
                    });
                }
            }
            // Reload the open stage's trail while it runs (live), and whenever its task id changes —
            // a re-run mints a new task, so the old task's trail must be replaced.
            const stage = this.vm.selectedStage;
            if (stage) {
                const entry = stageEntry(run, stage);
                if (
                    entry &&
                    (entry.status === "running" || entry.taskId !== this.loadedLogsTaskId)
                ) {
                    await this.loadLogs(run, stage);
                }
                // Refetch the artifact when the open stage advances to a new version — a re-run writes
                // its screenshots/crops under new keys, so a stale artifact would keep showing the old
                // images even after the re-run completes.
                if (entry && (entry.status === "done" || entry.status === "stale")) {
                    const key = `${stage}:${entry.stageVersion}`;
                    if (key !== this.loadedArtifactKey) {
                        await this.loadArtifact(run, stage);
                    }
                }
                /*
                 * While a render pass is in flight, poll its results so thumbnails appear when ready.
                 *
                 * Both flags, not just the whole-run one. A single-component pass sets
                 * `renderingSignatures` and nothing else, and it was missing from this condition — so
                 * the artifact was never re-read, `loadRenders` never ran, and the card's spinner ran
                 * for ever while the render had in fact completed seconds earlier.
                 */
                if (
                    stage === "generate" &&
                    (this.vm.rendering || this.vm.renderingSignatures.length > 0)
                ) {
                    await this.loadRenders(run);
                    this.giveUpOnStalledRenders();
                }
                // While a regenerate is in flight, poll the artifact so the refined component lands.
                if (stage === "generate" && this.vm.regenerating.length > 0) {
                    await this.pollRegenerations(run);
                }
                // While a Plan regenerate is in flight, poll so the fresh contract lands.
                if (stage === "plan" && this.vm.planRegenerating.length > 0) {
                    await this.pollPlanRegenerations(run);
                }
            }
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async runStage(stage: string) {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        this.pendingActionSince = Date.now();
        runInAction(() => {
            this.vm.actionStage = stage;
            this.vm.error = null;
            // A fresh run of the stage starts with a clean progress + log slate.
            delete this.vm.progressByStage[stage];
        });
        try {
            const result = await this.gateway.runStage(runId, stage);
            // Keep `actionStage` set (the "starting" indication) — it is NOT cleared here. There's a gap
            // between triggering the task and the task marking the stage "running", and clearing now would
            // drop the stage back to a plain "pending" look during that gap. refresh() clears it once the
            // ledger shows the stage picked up this task (or reached running).
            this.pendingActionTaskId = result.taskId;
            // Same pairing as `selectStage`: running a stage opens it, and the previous stage's
            // artifact must not survive into the new stage's first render.
            this.openStage(stage);
            await this.refresh();
        } catch (error) {
            this.pendingActionTaskId = null;
            this.pendingActionSince = null;
            runInAction(() => {
                this.vm.actionStage = null;
                this.vm.error = (error as Error).message;
            });
        }
    }

    selectStage(stage: string) {
        this.openStage(stage);
        if (this.vm.run) {
            void this.loadLogs(this.vm.run, stage);
            void this.loadArtifact(this.vm.run, stage);
        }
    }

    /**
     * Change the open stage and drop the previous stage's artifact in the same action.
     *
     * These two have to move together. `selectedStage` is observable, so the moment it changes MobX
     * re-renders — the new stage's view mounts immediately, synchronously, while `artifact` still
     * holds the stage it was showing before. `loadArtifact` clears it, but it is async and therefore
     * one render too late: the view has already read `components` off a Promote artifact, or
     * `promoted` off a Generate one, and thrown.
     *
     * Clearing here rather than in each view keeps the invariant in one place: whatever `artifact`
     * holds belongs to `artifactStage`, and `artifactStage` is the stage being rendered.
     */
    private openStage(stage: string | null) {
        runInAction(() => {
            if (this.vm.artifactStage !== stage) {
                this.loadedArtifactKey = null;
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
            }
            this.vm.selectedStage = stage;
        });
    }

    async setDiscoverExclusion(url: string, excluded: boolean): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        const signature = normalizeUrl(url);
        if (excluded) {
            await this.runCorrection(
                () =>
                    this.gateway.setOverride(runId, "discover", signature, {
                        kind: "discover.url",
                        action: "exclude"
                    }),
                { signature, kind: "discover.url" }
            );
            return;
        }
        // Re-include: clear the exclude override for this URL.
        const target = this.vm.overrides.find(
            override =>
                override.stage === "discover" &&
                override.structuralSignature === signature &&
                override.correction.kind === "discover.url" &&
                override.correction.action === "exclude"
        );
        if (target) {
            await this.clearOverride(target.id);
        }
    }

    async addDiscoverUrl(url: string): Promise<void> {
        const runId = this.vm.run?.id;
        const trimmed = url.trim();
        if (!runId || !trimmed) {
            return;
        }
        const signature = normalizeUrl(trimmed);
        await this.runCorrection(
            () =>
                this.gateway.setOverride(runId, "discover", signature, {
                    kind: "discover.url",
                    action: "add",
                    group: "manual"
                }),
            { signature, kind: "discover.url" }
        );
    }

    /**
     * Read the selected pages again, replacing them in place.
     *
     * Polled rather than timed, like the composition: one page is a desktop plus a narrow capture and
     * takes the better part of a minute, so a fixed wait is wrong for any selection but the one it was
     * tuned for. The screenshot refs are what is watched — the task writes new blob keys for a
     * re-capture precisely so the admin's per-session image cache cannot serve the picture being
     * replaced.
     */
    async recapturePages(urls: string[]): Promise<void> {
        const run = this.vm.run;
        if (!run || urls.length === 0 || this.vm.recapturing) {
            return;
        }

        // The Capture view is what triggers this, so the capture artifact is the one on screen.
        const current =
            this.vm.artifactStage === "capture"
                ? (this.vm.artifact as CaptureArtifactDto | null)
                : null;
        const before = new Set(
            (current?.pages ?? [])
                .filter(page => urls.includes(page.url))
                .map(page => page.screenshotRef)
        );

        runInAction(() => {
            this.vm.recapturing = true;
            this.vm.error = null;
        });

        try {
            await this.gateway.recapturePages(run.id, urls);
        } catch (error) {
            runInAction(() => {
                this.vm.recapturing = false;
                this.vm.error = (error as Error).message;
            });
            return;
        }

        for (let attempt = 0; attempt < 80; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            let latest;
            try {
                latest = (await this.gateway.getStageArtifact(run.id, "capture")) as
                    | CaptureArtifactDto
                    | undefined;
            } catch {
                continue;
            }
            const changed = (latest?.pages ?? []).some(
                page => urls.includes(page.url) && !before.has(page.screenshotRef)
            );
            if (changed) {
                runInAction(() => {
                    this.vm.recapturing = false;
                });
                await this.loadArtifact(run, "capture");
                await this.refresh();
                return;
            }
        }

        runInAction(() => {
            this.vm.recapturing = false;
            this.vm.error =
                "The re-capture was started but has not reported a result after four minutes. It may still be running — reopen the Capture step to check.";
        });
    }

    async excludeCapturedPages(urls: string[]): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId || urls.length === 0) {
            return;
        }
        try {
            const run = await this.gateway.excludeCapturedPages(runId, urls);
            runInAction(() => {
                this.vm.run = run;
            });
            await this.loadArtifact(run, "capture");
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    /**
     * Trigger a render pass, for everything or for one component.
     *
     * The busy state is per component when a signature is given, so re-rendering one card does not
     * grey out the rest — at roughly 45 seconds a component, a whole-run pass to see one edit is the
     * difference between a loop someone uses and one they avoid.
     *
     * Completion is detected by the renders artifact changing, which `refresh` already polls; this
     * only clears its own flag if the trigger itself fails.
     */
    async renderComponents(signature?: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        runInAction(() => {
            if (signature) {
                // What this component's screenshot is NOW, so the poll can tell a new one from it.
                const current = (this.vm.renders ?? []).find(
                    record => record.signature === signature
                );
                this.renderRefAtTrigger.set(signature, {
                    ref: current?.renderRef ?? null,
                    since: Date.now()
                });
                if (!this.vm.renderingSignatures.includes(signature)) {
                    this.vm.renderingSignatures.push(signature);
                }
            } else {
                this.vm.rendering = true;
            }
            this.vm.error = null;
        });
        try {
            await this.gateway.renderComponents(runId, signature);
        } catch (error) {
            runInAction(() => {
                if (signature) {
                    this.vm.renderingSignatures = this.vm.renderingSignatures.filter(
                        item => item !== signature
                    );
                } else {
                    this.vm.rendering = false;
                }
                this.vm.error = (error as Error).message;
            });
        }
    }

    async setDecision(signature: string, decision: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            const updated = (await this.gateway.setComponentDecision(
                runId,
                signature,
                decision
            )) as DecisionsDto | null;
            runInAction(() => {
                this.vm.decisions = updated?.decisions ?? {};
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async acceptAll(signatures: string[]): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId || signatures.length === 0) {
            return;
        }
        runInAction(() => {
            this.vm.error = null;
        });
        try {
            // Each call upserts one decision override and returns the full map; the last reflects them all.
            let latest: DecisionsDto | null = null;
            for (const signature of signatures) {
                latest = (await this.gateway.setComponentDecision(
                    runId,
                    signature,
                    "accepted"
                )) as DecisionsDto | null;
            }
            if (latest) {
                const decisions = latest.decisions;
                runInAction(() => {
                    this.vm.decisions = decisions ?? this.vm.decisions;
                });
            }
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async regenerateComponent(signature: string, instruction: string): Promise<void> {
        const runId = this.vm.run?.id;
        const trimmed = instruction.trim();
        if (!runId || !trimmed) {
            return;
        }
        // Remember the current revision so the refresh loop can tell when the refined version lands.
        // Not the source: refining is a model call that may return byte-identical source, and this
        // used to compare source strings — so a refine that changed nothing left the spinner on
        // forever. `revision` is bumped by the writer on every write, changed content or not.
        const artifact = this.vm.artifact as GenerateArtifactDto | null;
        const current = artifact?.components.find(component => component.signature === signature);
        this.regenerateBaseline[signature] = current?.revision ?? 0;
        runInAction(() => {
            this.vm.regenerating = [...new Set([...this.vm.regenerating, signature])];
            this.vm.error = null;
        });
        try {
            await this.gateway.regenerateComponent(runId, signature, trimmed);
        } catch (error) {
            runInAction(() => {
                this.vm.regenerating = this.vm.regenerating.filter(item => item !== signature);
                this.vm.error = (error as Error).message;
            });
        }
    }

    async regeneratePlanComponent(signature: string, instruction?: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        // Remember the current props so the refresh loop can tell when the fresh contract lands.
        const artifact = this.vm.artifact as PlanArtifactDto | null;
        const current = artifact?.components.find(component => component.signature === signature);
        this.planRegenerateBaseline[signature] = this.propsFingerprint(current?.props);
        runInAction(() => {
            this.vm.planRegenerating = [...new Set([...this.vm.planRegenerating, signature])];
            this.vm.error = null;
        });
        try {
            await this.gateway.regeneratePlanComponent(runId, signature, instruction?.trim());
        } catch (error) {
            runInAction(() => {
                this.vm.planRegenerating = this.vm.planRegenerating.filter(
                    item => item !== signature
                );
                this.vm.error = (error as Error).message;
            });
        }
    }

    /** A stable fingerprint of a component's props, so a regenerate is detected when the contract changes. */
    private propsFingerprint(
        props: PlanArtifactDto["components"][number]["props"] | undefined
    ): string {
        return JSON.stringify((props ?? []).map(prop => `${prop.name}:${prop.type}`));
    }

    /**
     * While a Plan regenerate is in flight, reload the Plan artifact and clear each signature whose props
     * changed — the task replaces the component's contract in place, so a changed fingerprint means done.
     */
    private async pollPlanRegenerations(run: RunDto): Promise<void> {
        await this.loadArtifact(run, "plan");
        const artifact = this.vm.artifact as PlanArtifactDto | null;
        const stillRunning = this.vm.planRegenerating.filter(signature => {
            const component = artifact?.components.find(item => item.signature === signature);
            return (
                !component ||
                this.propsFingerprint(component.props) === this.planRegenerateBaseline[signature]
            );
        });
        if (stillRunning.length !== this.vm.planRegenerating.length) {
            runInAction(() => {
                this.vm.planRegenerating = stillRunning;
            });
        }
    }

    /**
     * While a regenerate is in flight, reload the Generate artifact and clear each signature whose
     * revision has moved — the refine task bumps it on every write, so this terminates even when the
     * model returns the same source it was given.
     */
    private async pollRegenerations(run: RunDto): Promise<void> {
        await this.loadArtifact(run, "generate");
        const artifact = this.vm.artifact as GenerateArtifactDto | null;
        const stillRunning = this.vm.regenerating.filter(signature => {
            const component = artifact?.components.find(item => item.signature === signature);
            return !component || component.revision === this.regenerateBaseline[signature];
        });
        if (stillRunning.length !== this.vm.regenerating.length) {
            runInAction(() => {
                this.vm.regenerating = stillRunning;
            });
        }
    }

    /**
     * Fetches one component in full, for the view that shows its code.
     *
     * The Generate list is served without source — the artifact references its components so that its
     * size depends on how many a run produced rather than how large they are — so opening one is a
     * fetch. Returns null rather than throwing: a missing component should leave the panel empty, not
     * break the run view around it.
     */
    async loadComponentDetail(
        runId: string,
        signature: string
    ): Promise<GeneratedComponentDetailDto | null> {
        try {
            const detail = await this.gateway.getGeneratedComponent(runId, signature);
            return (detail as GeneratedComponentDetailDto | null) ?? null;
        } catch {
            return null;
        }
    }

    /**
     * The prompt this component would be generated from, built fresh from the current plan and theme.
     *
     * Not stored with the component: it answers "what would the next run send", which is the question
     * asked while looking at a render that came out wrong. Every generation defect this project has
     * fixed was fixed by changing what the model is told, and each was first seen in a picture and
     * only then traced back to a line that was missing from the prompt.
     */
    async loadComponentPrompt(runId: string, signature: string): Promise<ComponentPromptDto | null> {
        try {
            const prompt = await this.gateway.getComponentPrompt(runId, signature);
            return (prompt as ComponentPromptDto | null) ?? null;
        } catch {
            return null;
        }
    }

    toggleTokens(): void {
        const opening = !this.vm.showTokens;
        runInAction(() => {
            this.vm.showTokens = opening;
            this.vm.showOverrides = false;
            this.vm.showComposed = false;
        });
        if (opening && this.vm.run && this.vm.modelCalls === null) {
            void this.loadModelCalls(this.vm.run);
        }
    }

    /**
     * The composed-pages panel. Composition runs outside the nine stages and has no ledger entry, so
     * it is a panel beside the stage views rather than a tenth stage — the same place Overrides and
     * Token usage sit, for the same reason.
     *
     * Unlike those two, this panel's open state lives in the route, so this is a SETTER rather than a
     * toggle: the URL decides, and the view calls this to bring the view model in line with it. A
     * toggle here would make the route and the view model two sources of truth that drift — the URL
     * saying one page and the panel showing another, which for a view whose purpose is linking to a
     * specific page would be the one defect that matters. Idempotent, because the effect that calls
     * it re-runs whenever the route changes for any reason.
     */
    openComposed(open: boolean, comparedPath: string | null): void {
        if (this.vm.showComposed !== open || this.vm.comparedPath !== comparedPath) {
            runInAction(() => {
                this.vm.showComposed = open;
                this.vm.comparedPath = open ? comparedPath : null;
                if (open) {
                    this.vm.showTokens = false;
                    this.vm.showOverrides = false;
                }
            });
        }

        /*
         * Loading is checked on every call, not only when the state changed.
         *
         * A link carrying `?composed=true` opens the panel during the first render, before `init`
         * has resolved the run — so this runs once with no run to load for, and the state is already
         * correct by the time the run arrives. Tying the load to the state change meant the panel
         * reported "This run has not been composed" for a run that had been, with the query never
         * sent. The caller re-invokes when the run id appears; this has to be ready for that call to
         * change nothing except start the fetch.
         */
        if (open && this.vm.run && this.vm.pageMap === null && !this.vm.pageMapLoading) {
            void this.loadPageMap(this.vm.run);
        }
    }

    /**
     * Compose this run's pages.
     *
     * Composition is not a pipeline stage: no ledger entry, no stage version, no websocket event. So
     * there is nothing to subscribe to and the only evidence it finished is the page map changing —
     * which is what this waits for, rather than guessing at a duration.
     *
     * Composing also makes this run the live composition of its job and retires the other runs', so
     * the map is reloaded in full afterwards: the liveness of every path can change, not just this
     * run's own pages.
     */
    async composePages(): Promise<void> {
        const run = this.vm.run;
        if (!run || this.vm.composing) {
            return;
        }

        const before = this.vm.pageMap?.composeVersion ?? 0;
        runInAction(() => {
            this.vm.composing = true;
            this.vm.error = null;
        });

        try {
            await this.gateway.composePages(run.id);
        } catch (error) {
            runInAction(() => {
                this.vm.composing = false;
                this.vm.error = (error as Error).message;
            });
            return;
        }

        // Polled rather than timed. A two-page site finishes in seconds and an eleven-page one takes
        // over a minute, so any fixed wait is wrong for one of them.
        for (let attempt = 0; attempt < 60; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            let map;
            try {
                map = await this.gateway.getPageMap(run.id);
            } catch {
                continue;
            }
            if (map && (map.composeVersion ?? 0) > before) {
                runInAction(() => {
                    this.vm.composing = false;
                    // Dropped so the reload below refetches everything, liveness included.
                    this.vm.pageMap = null;
                    this.vm.livePageByPath = {};
                });
                await this.loadPageMap(run);
                return;
            }
        }

        runInAction(() => {
            this.vm.composing = false;
            this.vm.error =
                "The composition was started but has not reported a result after three minutes. It may still be running — reopen this panel to check.";
        });
    }

    /** The run's composed pages. Absent is a normal answer — most runs are never composed. */
    private async loadPageMap(run: RunDto): Promise<void> {
        runInAction(() => {
            this.vm.pageMapLoading = true;
        });
        try {
            /*
             * All three together: the map says what was composed, Assemble says what each page was
             * composed from — its source screenshot and its instances — and the capture says whether
             * anyone has photographed the result. The comparison needs all of them, and loading them
             * separately would show half a comparison while the other half arrives.
             *
             * The capture is null for almost every run, which is the resting state rather than a
             * failure: nothing here can photograph a composed page on its own.
             */
            const [pageMap, assemble, composedCapture, websiteDomain] = await Promise.all([
                this.gateway.getPageMap(run.id),
                this.gateway.getStageArtifact(run.id, "assemble"),
                this.gateway.getComposedCapture(run.id),
                // Where the composed pages are actually served, so the panel can link to one.
                this.gateway.getWebsiteDomain().catch(() => null)
            ]);
            runInAction(() => {
                this.vm.pageMap = pageMap;
                this.vm.composedAssemble = (assemble as AssembleArtifactDto | null) ?? null;
                this.vm.composedCapture = composedCapture;
                this.vm.websiteDomain = websiteDomain;
                this.vm.pageMapLoading = false;
            });

            /*
             * Which page each path actually serves — fetched after the map, because it needs the
             * paths, and separately because the panel is useful without it. A failure here leaves the
             * liveness unknown rather than blocking the pages themselves.
             */
            if (pageMap) {
                const live = await this.gateway
                    .getLivePageIds(pageMap.pages.map(page => page.path))
                    .catch(() => ({}));
                runInAction(() => {
                    this.vm.livePageByPath = live;
                });
            }
        } catch (error) {
            runInAction(() => {
                this.vm.pageMapLoading = false;
                this.vm.error = (error as Error).message;
            });
        }
    }

    toggleOverrides(): void {
        const opening = !this.vm.showOverrides;
        runInAction(() => {
            this.vm.showOverrides = opening;
            this.vm.showTokens = false;
            this.vm.showComposed = false;
        });
        if (opening && this.vm.run) {
            void this.loadOverrides(this.vm.run);
            void this.loadReattachments(this.vm.run);
        }
    }

    /** Load this run's override reattachment outcomes for the panel (W8.7). */
    private async loadReattachments(run: RunDto): Promise<void> {
        try {
            const reattachments = await this.gateway.getReattachments(run.id);
            runInAction(() => {
                this.vm.reattachments = reattachments as ReattachmentDto[];
            });
        } catch {
            // A missing/failed reattachment list must not break the panel.
        }
    }

    // ----- Cluster correction controls (W8.3) ----------------------------------------------------

    /** Load the job's overrides, for the correction badges. */
    private async loadOverrides(run: RunDto): Promise<void> {
        try {
            const overrides = await this.gateway.listOverrides(run.jobId);
            runInAction(() => {
                this.vm.overrides = overrides as OverrideDto[];
            });
        } catch {
            // A missing/failed override list must not break the cluster view.
        }
    }

    /** Load the machine (un-overridden) artifact for a stage, so a corrected item can show its original. */
    private async loadMachineArtifact(run: RunDto, stage: string): Promise<void> {
        try {
            const machine = await this.gateway.getStageArtifact(run.id, stage, true);
            runInAction(() => {
                this.vm.machineArtifact = machine;
                this.vm.machineArtifactStage = stage;
            });
        } catch {
            runInAction(() => {
                this.vm.machineArtifact = null;
                this.vm.machineArtifactStage = stage;
            });
        }
    }

    async setClassification(signature: string, name?: string, type?: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        // A classify.set override is a single record per cluster carrying BOTH name and type. Name and
        // type are edited independently, so merge the changed field onto the existing override — otherwise
        // setting the name would drop a previously-set type (and vice versa), reverting it to the machine
        // value.
        const existing = this.vm.overrides.find(
            override =>
                override.stage === "classify" &&
                override.structuralSignature === signature &&
                override.correction.kind === "classify.set"
        );
        const mergedName = name ?? (existing?.correction.name as string | undefined);
        const mergedType = type ?? (existing?.correction.type as string | undefined);
        await this.runCorrection(
            () =>
                this.gateway.setOverride(runId, "classify", signature, {
                    kind: "classify.set",
                    name: mergedName,
                    type: mergedType
                }),
            { signature, kind: "classify.set" }
        );
    }

    async setPlanProp(
        signature: string,
        op: "edit" | "add" | "remove",
        propName: string,
        extra?: { newName?: string; type?: string }
    ): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        await this.runCorrection(
            () =>
                this.gateway.setOverride(runId, "plan", signature, {
                    kind: "plan.prop",
                    op,
                    propName,
                    newName: extra?.newName,
                    type: extra?.type
                }),
            { signature, kind: "plan.prop" }
        );
    }

    /** Load the Promote gate: the promotable generated components, decisions, Library names, overrides. */
    private async loadPromoteGate(run: RunDto): Promise<void> {
        try {
            const [generate, names, decisions] = await Promise.all([
                this.gateway.getStageArtifact(
                    run.id,
                    "generate"
                ) as Promise<GenerateArtifactDto | null>,
                this.gateway.listLibraryNames(),
                this.gateway.getDecisions(run.id) as Promise<DecisionsDto | null>
            ]);
            runInAction(() => {
                this.vm.promoteComponents = generate?.components ?? [];
                this.vm.libraryNames = names;
                this.vm.decisions = decisions?.decisions ?? this.vm.decisions;
            });
        } catch {
            // A missing gate input just yields an empty gate, not an error.
        }
    }

    async setPromoteSelection(signature: string, selected: boolean): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        const overrides = await this.gateway.setOverride(runId, "promote", signature, {
            kind: "promote.select",
            selected
        });
        runInAction(() => {
            this.vm.overrides = overrides as OverrideDto[];
        });
    }

    async setPromoteCollision(
        signature: string,
        resolution: "replace" | "keepBoth",
        renameTo?: string
    ): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        const overrides = await this.gateway.setOverride(runId, "promote", signature, {
            kind: "promote.collision",
            resolution,
            renameTo
        });
        runInAction(() => {
            this.vm.overrides = overrides as OverrideDto[];
        });
    }

    toggleClusterSelection(signature: string): void {
        runInAction(() => {
            this.vm.selectedClusters = this.vm.selectedClusters.includes(signature)
                ? this.vm.selectedClusters.filter(item => item !== signature)
                : [...this.vm.selectedClusters, signature];
        });
    }

    clearClusterSelection(): void {
        runInAction(() => {
            this.vm.selectedClusters = [];
        });
    }

    async mergeSelectedClusters(pinnedSignature?: string): Promise<void> {
        const runId = this.vm.run?.id;
        const selected = this.vm.selectedClusters;
        if (!runId || selected.length < 2) {
            return;
        }
        const primary = pinnedSignature ?? selected[0];
        // Spread to a plain array — `selected` is a live observable, not a request payload.
        await this.applyClusterCorrection(runId, primary, {
            kind: "cluster.merge",
            representativeSignatures: [...selected],
            representativeSignature: pinnedSignature
        });
    }

    async splitClusterMembers(sourceSignature: string, memberSignatures: string[]): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId || memberSignatures.length === 0) {
            return;
        }
        void sourceSignature;
        await this.applyClusterCorrection(runId, memberSignatures[0], {
            kind: "cluster.split",
            memberSignatures
        });
    }

    async moveClusterMember(memberSignature: string, targetSignature: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        await this.applyClusterCorrection(runId, memberSignature, {
            kind: "cluster.move",
            memberSignature,
            targetRepresentativeSignature: targetSignature
        });
    }

    async excludeCluster(signature: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        await this.applyClusterCorrection(runId, signature, { kind: "cluster.exclude" });
    }

    async applyThreshold(threshold: number): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            // A parameter override — it changes what Cluster runs with, so it takes effect by re-running.
            const overrides = await this.gateway.setOverride(runId, "cluster", "", {
                kind: "cluster.threshold",
                threshold
            });
            runInAction(() => {
                this.vm.overrides = overrides as OverrideDto[];
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
            return;
        }
        await this.runStage("cluster");
    }

    async applySegmentMaxHeight(maxSectionHeight: number): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        try {
            // A parameter override — it changes what Segment runs with, so it takes effect by re-running.
            const overrides = await this.gateway.setOverride(runId, "segment", "", {
                kind: "segment.maxSectionHeight",
                maxSectionHeight
            });
            runInAction(() => {
                this.vm.overrides = overrides as OverrideDto[];
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
            return;
        }
        await this.runStage("segment");
    }

    async clearOverride(overrideId: string): Promise<void> {
        const runId = this.vm.run?.id;
        if (!runId) {
            return;
        }
        await this.runCorrection(() => this.gateway.clearOverride(runId, overrideId));
    }

    private async applyClusterCorrection(
        runId: string,
        signature: string,
        correction: Record<string, unknown>
    ): Promise<void> {
        await this.runCorrection(
            () => this.gateway.setOverride(runId, "cluster", signature, correction),
            { signature, kind: correction.kind as string }
        );
    }

    /**
     * Run a correction, then reload: the correction re-applies in place (so the effective cluster
     * artifact changed without a version bump) and marks downstream stale (so the run's ledger changed).
     *
     * `expect` identifies the correction just made (its signature + kind) so we surface ONLY its outcome —
     * not some other, older override at the same stage that happens to be unapplied.
     */
    private async runCorrection(
        action: () => Promise<OverrideDto[]>,
        expect?: { signature: string; kind: string }
    ): Promise<void> {
        const runId = this.vm.run?.id;
        const stage = this.vm.selectedStage;
        if (!runId || !stage) {
            return;
        }
        runInAction(() => {
            this.vm.clusterBusy = true;
            this.vm.error = null;
        });
        try {
            const overrides = await action();
            const run = await this.gateway.getRun(runId);
            runInAction(() => {
                this.vm.overrides = overrides as OverrideDto[];
                this.vm.selectedClusters = [];
                this.vm.run = run;
                this.vm.clusterBusy = false;
            });
            // Force a refetch of the open stage's effective artifact — a correction does not bump the
            // stage version — and refresh its machine copy for the "was" hint.
            this.loadedArtifactKey = null;
            await this.loadArtifact(run, stage);
            // Refresh the reattachment list for the panel, and surface THIS correction's own failure —
            // matched by its signature + kind so an unrelated older override never masquerades as it.
            try {
                const reattachments = await this.gateway.getReattachments(runId);
                runInAction(() => {
                    this.vm.reattachments = reattachments as ReattachmentDto[];
                });
                const failed =
                    expect &&
                    (reattachments as ReattachmentDto[]).find(
                        entry =>
                            entry.stage === stage &&
                            entry.signature === expect.signature &&
                            entry.kind === expect.kind &&
                            entry.status !== "applied"
                    );
                if (failed) {
                    runInAction(() => {
                        this.vm.error = `That correction could not be applied — ${
                            failed.reason ?? "its target isn't present in the current output."
                        }`;
                    });
                }
            } catch {
                // A reattachment-check failure must not mask the correction itself.
            }
        } catch (error) {
            runInAction(() => {
                this.vm.clusterBusy = false;
                this.vm.error = (error as Error).message;
            });
        }
    }

    /** Load a run's individual model calls for the token panel. */
    private async loadModelCalls(run: RunDto): Promise<void> {
        runInAction(() => {
            this.vm.modelCallsLoading = true;
        });
        try {
            const calls = (await this.gateway.listModelCalls(run.id)) as ModelCallDto[] | null;
            runInAction(() => {
                this.vm.modelCalls = calls ?? [];
                this.vm.modelCallsLoading = false;
            });
        } catch {
            runInAction(() => {
                this.vm.modelCalls = [];
                this.vm.modelCallsLoading = false;
            });
        }
    }

    /** Load the Plan-gate cost projection when the Plan stage is open. */
    private async loadPlanProjection(run: RunDto): Promise<void> {
        try {
            const projection = (await this.gateway.projectPlanCost(
                run.id
            )) as PlanCostProjectionDto | null;
            runInAction(() => {
                this.vm.planProjection = projection;
            });
        } catch {
            runInAction(() => {
                this.vm.planProjection = null;
            });
        }
    }

    /** Load the accept/reject decisions and the source crop refs the Generate view pairs with renders. */
    private async loadGenerateExtras(run: RunDto): Promise<void> {
        try {
            const [decisions, plan] = await Promise.all([
                this.gateway.getDecisions(run.id) as Promise<DecisionsDto | null>,
                this.gateway.getStageArtifact(run.id, "plan") as Promise<PlanArtifactDto | null>
            ]);
            const sourceCrops: Record<string, string> = {};
            for (const planned of plan?.components ?? []) {
                sourceCrops[planned.signature] = planned.representativeCrop.cropRef;
            }
            runInAction(() => {
                this.vm.decisions = decisions?.decisions ?? {};
                this.vm.sourceCrops = sourceCrops;
            });
        } catch {
            // The comparison still renders without the source crop or a prior decision.
        }
    }

    /**
     * Stop waiting on a render that is never going to report.
     *
     * A render task that fails before it writes anything — the sandbox host unreachable, the browser
     * unable to start — leaves no record at all, and "done when the record changes" waits for a record
     * that will never arrive. That is the same stuck spinner in another guise, so the wait is bounded
     * and says what happened rather than sitting there.
     */
    private giveUpOnStalledRenders(): void {
        const stalled = this.vm.renderingSignatures.filter(signature => {
            const started = this.renderRefAtTrigger.get(signature)?.since;
            return started !== undefined && Date.now() - started > RENDER_STALL_TIMEOUT_MS;
        });
        if (stalled.length === 0) {
            return;
        }
        runInAction(() => {
            this.vm.renderingSignatures = this.vm.renderingSignatures.filter(
                signature => !stalled.includes(signature)
            );
            this.vm.error =
                "A render was started but reported nothing for five minutes. It may have failed before it could record anything — check the task's logs, and that the website app and its tunnel are up.";
        });
        for (const signature of stalled) {
            this.renderRefAtTrigger.delete(signature);
        }
    }

    /** Load the run's rendered-component screenshots, if the render pass has produced them. */
    private async loadRenders(run: RunDto): Promise<void> {
        try {
            const artifact = (await this.gateway.getRenders(run.id)) as RenderArtifactDto | null;
            runInAction(() => {
                this.vm.renders = artifact?.renders ?? null;
                // The artifact is written when the pass completes, so its arrival clears "rendering".
                if (artifact?.renders) {
                    this.vm.rendering = false;
                    /*
                     * A component is done when its render has CHANGED, not when one is present. A
                     * re-render of a component that already had a screenshot would otherwise clear
                     * instantly against the picture it is replacing, and the card would show the old
                     * image looking settled. The ref recorded when the button was pressed is the
                     * baseline; an error clears too, so a failure stops the spinner and shows itself.
                     */
                    const bySignature = new Map(
                        artifact.renders.map(record => [record.signature, record])
                    );
                    this.vm.renderingSignatures = this.vm.renderingSignatures.filter(signature => {
                        const record = bySignature.get(signature);
                        if (!record) {
                            return true;
                        }
                        if (record.error) {
                            this.renderRefAtTrigger.delete(signature);
                            return false;
                        }
                        const before = this.renderRefAtTrigger.get(signature);
                        const changed = (record.renderRef ?? null) !== (before?.ref ?? null);
                        if (changed) {
                            this.renderRefAtTrigger.delete(signature);
                        }
                        return !changed;
                    });
                }
            });
        } catch {
            // A missing render artifact is the normal "not rendered yet" state, not an error to surface.
        }
    }

    /** Load the selected stage's structured artifact for its visibility view. */
    private async loadArtifact(run: RunDto, stage: string) {
        // Switching stages: drop the previous stage's artifact immediately. Otherwise a shape-specific
        // view (e.g. Plan expects `components`, Cluster `clusters`) can render against the wrong stage's
        // artifact during the async load and crash on a missing field.
        if (this.vm.artifactStage !== stage) {
            this.loadedArtifactKey = null;
            runInAction(() => {
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
            });
        }
        const entry = stageEntry(run, stage);
        // No artifact before a stage has produced output; clear so the view shows the right empty state.
        if (!entry || (entry.status !== "done" && entry.status !== "stale")) {
            this.loadedArtifactKey = null;
            runInAction(() => {
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
                this.vm.artifactLoading = false;
            });
            return;
        }
        runInAction(() => {
            this.vm.artifactLoading = true;
        });
        try {
            const artifact = await this.gateway.getStageArtifact(run.id, stage);
            // Tag the loaded artifact with the stage version it came from, so a later re-run to a new
            // version (whose artifacts — screenshots, crops — live under new keys) is refetched.
            this.loadedArtifactKey = `${stage}:${entry.stageVersion}`;
            runInAction(() => {
                this.vm.artifact = artifact;
                this.vm.artifactStage = stage;
                this.vm.artifactLoading = false;
            });
            // The Generate view pairs each component with its rendered screenshot (W7.7), its source
            // crop and the operator's accept/reject decisions (W7.8).
            if (stage === "generate") {
                void this.loadRenders(run);
                void this.loadGenerateExtras(run);
            }
            // The Plan gate shows the projected generation cost before approval (W7.9).
            if (stage === "plan") {
                void this.loadPlanProjection(run);
            }
            // The correction stages need the job's overrides (badges) and, for classify/plan, the
            // machine artifact so an edited item can show its original machine value (W8.3–8.5).
            if (
                stage === "discover" ||
                stage === "cluster" ||
                stage === "classify" ||
                stage === "plan" ||
                stage === "promote"
            ) {
                void this.loadOverrides(run);
            }
            if (stage === "discover" || stage === "classify" || stage === "plan") {
                void this.loadMachineArtifact(run, stage);
            }
            // The Promote gate lists the generated components eligible for promotion, with collision
            // detection against the Library (W8.6).
            if (stage === "promote") {
                void this.loadPromoteGate(run);
            }
        } catch {
            runInAction(() => {
                this.vm.artifact = null;
                this.vm.artifactStage = stage;
                this.vm.artifactLoading = false;
            });
        }
    }

    applyProgress(stage: string, progress: StageProgress) {
        runInAction(() => {
            this.vm.progressByStage[stage] = progress;
            // Live-append to the visible trail when this is the open stage; the poll's fetch from the
            // task output later replaces it with the authoritative list, healing any gaps.
            if (this.vm.logsStage === stage) {
                this.vm.logs = [
                    ...this.vm.logs,
                    { message: progress.message, type: "info", createdOn: new Date().toISOString() }
                ].slice(-100);
            }
        });
    }

    /** Load the task log trail for a stage, if it has a task id yet. */
    private async loadLogs(run: RunDto, stage: string) {
        const taskId = stageEntry(run, stage)?.taskId ?? null;
        const taskChanged = taskId !== this.loadedLogsTaskId;
        const stageChanged = this.vm.logsStage !== stage;
        this.loadedLogsTaskId = taskId;
        if (!taskId) {
            runInAction(() => {
                this.vm.logs = [];
                this.vm.logsStage = stage;
            });
            return;
        }
        runInAction(() => {
            this.vm.logsLoading = true;
        });
        try {
            const logs = await this.gateway.listStageLogs(taskId);
            runInAction(() => {
                // On a same-task refresh, only GROW the trail. The websocket already appends every
                // activity line live, and the task-output snapshot can come back shorter mid-run (a fresh
                // continuation iteration has not re-accumulated it yet) — replacing with it would collapse
                // the live trail back to "started" (the flicker). A longer fetch still replaces, so real
                // gap-healing survives; a task/stage change replaces outright, since a reset is correct there.
                if (taskChanged || stageChanged || logs.length > this.vm.logs.length) {
                    this.vm.logs = logs;
                }
                this.vm.logsStage = stage;
                this.vm.logsLoading = false;
            });
        } catch (error) {
            // A log-fetch failure must not disrupt the run view; leave whatever was there, but surface
            // it to the console so a broken query isn't silently invisible.
            console.warn("[component-extraction] Could not load stage logs:", error);
            runInAction(() => {
                this.vm.logsLoading = false;
            });
        }
    }
}

export const RunViewPresenter = PresenterAbstraction.createImplementation({
    implementation: RunViewPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
