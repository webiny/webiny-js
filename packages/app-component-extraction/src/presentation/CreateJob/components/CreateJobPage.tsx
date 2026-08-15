import React, { useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import {
    Alert,
    Button,
    Checkbox,
    Heading,
    Input,
    SegmentedControl,
    Select,
    Separator,
    Text,
    useToast
} from "@webiny/admin-ui";
import { CreateJobFeature } from "../feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { Breadcrumb, StageKindChip, STAGE_META } from "~/presentation/shared/index.js";
import { Routes } from "~/routes.js";
import type { GatePreset } from "../abstractions.js";

const GATE_PRESETS: { label: string; value: GatePreset }[] = [
    { label: "Pause at every stage", value: "every" },
    { label: "URL list and plan only", value: "urlAndPlan" },
    { label: "Custom", value: "custom" }
];

import type { ReachabilityDto } from "~/shared/types.js";

/** The reachability hint under the Site URL field (spec §3). */
const reachabilityHint = (checking: boolean, result: ReachabilityDto | null): React.ReactNode => {
    if (checking) {
        return (
            <Text size="sm" className="text-neutral-strong">
                Checking the site…
            </Text>
        );
    }
    if (!result) {
        return (
            <Text size="sm" className="text-neutral-strong">
                The site is checked for reachability and a sitemap before the crawl.
            </Text>
        );
    }
    if (!result.reachable) {
        return (
            <Text size="sm" className="text-destructive-primary">
                {result.error ?? "The site could not be reached."}
            </Text>
        );
    }
    return (
        <Text size="sm" className="text-success-primary">
            Reachable · {result.status} OK ·{" "}
            {result.sitemapFound
                ? `sitemap.xml found (${result.sitemapUrlCount} URLs)`
                : "no sitemap found — a link crawl will be used"}
        </Text>
    );
};

const CreateJobContent = createReactiveComponent(function CreateJobContent() {
    const { presenter } = useFeature(CreateJobFeature);
    const { goToRoute } = useRouter();
    const toast = useToast();

    const { vm } = presenter;

    useEffect(() => {
        presenter.init();
        return () => presenter.reset();
    }, [presenter]);

    const themeOptions = useMemo(
        () =>
            vm.themes.map(theme => ({
                label: `${theme.name} (v${theme.version})`,
                value: theme.id
            })),
        [vm.themes]
    );

    const noThemes = !vm.loadingThemes && vm.themes.length === 0;
    const stopAfter = new Set(vm.stopAfter);
    const blocked =
        !vm.name.trim() ||
        !vm.siteUrl.trim() ||
        !vm.themeId ||
        noThemes ||
        vm.reachability?.reachable === false;

    const goList = () => goToRoute(Routes.List);

    const handleCreate = async () => {
        try {
            const runId = await presenter.create();
            toast.showSuccessToast({ title: "Extraction created." });
            goToRoute(Routes.Run, { runId });
        } catch (error) {
            toast.showWarningToast({
                title: "Could not create extraction",
                description: (error as Error).message
            });
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-lg px-md py-lg">
            <Breadcrumb
                items={[{ label: "Extractions", onClick: goList }, { label: "New extraction" }]}
            />

            <div className="flex flex-col gap-xxs">
                <Heading level={3}>New extraction</Heading>
                <Text className="text-neutral-strong">
                    Point Webiny at a site; it crawls the pages and generates components you review
                    one stage at a time.
                </Text>
            </div>

            {noThemes ? (
                <Alert type="warning">
                    No theme exists for this tenant yet. Extract a theme first — generated
                    components bind to a theme version&apos;s tokens.
                </Alert>
            ) : null}

            <div className="flex flex-col gap-md rounded-lg border border-neutral-dimmed bg-neutral-base p-lg">
                <Input
                    label="Job name"
                    value={vm.name}
                    onChange={(value: string) => presenter.setName(value)}
                    placeholder="Acme marketing site"
                    required
                />

                <div className="flex flex-col gap-xs">
                    <div className="flex items-end gap-sm">
                        <div className="flex-1">
                            <Input
                                label="Site URL"
                                value={vm.siteUrl}
                                onChange={(value: string) => presenter.setSiteUrl(value)}
                                onBlur={() => void presenter.checkReachability()}
                                placeholder="https://www.example.com"
                                required
                            />
                        </div>
                        <Button
                            variant="secondary"
                            text={vm.checkingReachability ? "Checking…" : "Check"}
                            disabled={!vm.siteUrl.trim() || vm.checkingReachability}
                            onClick={() => void presenter.checkReachability()}
                        />
                    </div>
                    {reachabilityHint(vm.checkingReachability, vm.reachability)}
                </div>

                <Select
                    label="Theme"
                    value={vm.themeId}
                    onChange={(value: string) => presenter.setTheme(value)}
                    placeholder={vm.loadingThemes ? "Loading themes…" : "Select a theme"}
                    options={themeOptions}
                    note="Generated components bind to this theme version's tokens."
                    required
                />

                <Input
                    label="Crawl page cap"
                    type="number"
                    value={vm.pageCap}
                    onChange={(value: string) => presenter.setPageCap(value)}
                    note="Sampled across path groups. Capped at 150."
                />

                <Separator />

                <div className="flex flex-col gap-sm">
                    <div className="flex flex-col gap-xxs">
                        <Heading level={6}>Gate configuration</Heading>
                        <Text size="sm" className="text-neutral-strong">
                            Where the run pauses for your review. Toggling a stage switches to
                            Custom.
                        </Text>
                    </div>
                    <SegmentedControl
                        items={GATE_PRESETS}
                        value={vm.gatePreset}
                        onChange={(value: string) => presenter.setGatePreset(value as GatePreset)}
                    />
                    <div className="grid grid-cols-3 gap-sm">
                        {STAGE_META.map(meta => (
                            <div
                                key={meta.stage}
                                className="flex items-center gap-xs rounded-sm px-xs py-xxs hover:bg-neutral-light"
                            >
                                <Checkbox
                                    checked={stopAfter.has(meta.stage)}
                                    onChange={() => presenter.toggleGate(meta.stage)}
                                    label={`${meta.number} · ${meta.label}`}
                                />
                                <StageKindChip kind={meta.kind} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {vm.error ? <Alert type="danger">{vm.error}</Alert> : null}

            <div className="flex items-center justify-end gap-sm">
                <Button variant="tertiary" text="Cancel" onClick={goList} />
                <Button
                    variant="primary"
                    text={vm.creating ? "Creating…" : "Create and run"}
                    disabled={blocked || vm.creating}
                    onClick={() => void handleCreate()}
                />
            </div>
        </div>
    );
});

export const CreateJobPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        CreateJobFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <div className="h-main-content overflow-y-auto bg-neutral-subtle">
                <CreateJobContent />
            </div>
        </DiContainerProvider>
    );
};
