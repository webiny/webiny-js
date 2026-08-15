import React, { useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import { DialogsProvider } from "@webiny/app-admin/components/index.js";
import {
    Button,
    DataTable,
    DropdownMenu,
    EmptyState,
    Heading,
    Icon,
    IconButton,
    Input,
    Scrollbar,
    Select,
    Separator,
    Text,
    TimeAgo,
    Tooltip,
    cn,
    useToast
} from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as OpenIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as PlayIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { ReactComponent as DuplicateIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ExtractionListFeature } from "../feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { useCreateJobDialog } from "~/presentation/CreateJob/components/CreateJobDialog.js";
import { currentStage } from "~/shared/ledger.js";
import {
    StagePips,
    StageStatus,
    StageKindChip,
    stageMeta,
    runOverallStatus,
    runStageStatuses
} from "~/presentation/shared/index.js";
import { Routes } from "~/routes.js";
import type { JobListItemDto } from "~/shared/types.js";
import type { ListSort, StatusFilter } from "../abstractions.js";

type JobRow = JobListItemDto & { id: string; name: string; siteUrl: string };

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Status: all" },
    { value: "not-started", label: "Never run" },
    { value: "running", label: "Running" },
    { value: "paused", label: "Paused at gate" },
    { value: "failed", label: "Failed" },
    { value: "complete", label: "Complete" }
];

const SORT_OPTIONS: { value: ListSort; label: string }[] = [
    { value: "lastRun", label: "Last run" },
    { value: "name", label: "Name" }
];

/** A tab in the Library / Extractions strip: label, count, active underline (spec §2). */
const TabItem = ({
    label,
    count,
    active,
    muted,
    title
}: {
    label: string;
    count: number;
    active?: boolean;
    muted?: boolean;
    title?: string;
}) => (
    <div
        title={title}
        className={cn(
            "-mb-px flex items-center gap-xs border-b-2 pb-sm pt-xs",
            active ? "border-primary" : "border-transparent",
            muted && "cursor-default"
        )}
    >
        <Text
            size="md"
            className={cn(active ? "font-semibold text-neutral-primary" : "text-neutral-strong")}
        >
            {label}
        </Text>
        <Text size="sm" className="text-neutral-strong">
            {count}
        </Text>
    </div>
);

/** The Job cell: pin indicator + name (opens the job) with the site URL beneath. */
const JobCell = ({ item, onOpen }: { item: JobRow; onOpen: () => void }) => (
    <div className="flex items-start gap-sm">
        <Icon
            icon={<PinIcon />}
            label={item.job.pinned ? "Pinned" : "Not pinned"}
            size="sm"
            className={cn(
                "mt-xxs",
                item.job.pinned ? "[&_svg]:fill-primary" : "[&_svg]:fill-neutral-muted"
            )}
        />
        <div className="min-w-0">
            <Text
                className="cursor-pointer truncate font-medium text-neutral-primary hover:underline"
                onClick={onOpen}
            >
                {item.job.name}
            </Text>
            <Text size="sm" className="truncate text-neutral-strong">
                {item.job.siteUrl}
            </Text>
        </div>
    </div>
);

/** The Current-stage cell: "N · Label" (+ AI chip on model stages) over the nine-pip strip (spec §2). */
const CurrentStageCell = ({ item }: { item: JobRow }) => {
    const run = item.latestRun;
    const pips = <StagePips statuses={runStageStatuses(run)} className="mt-xs" />;
    if (!run) {
        return (
            <div className="flex flex-col gap-xxs">
                <Text size="sm" className="text-neutral-strong">
                    —
                </Text>
                {pips}
            </div>
        );
    }
    const stage = currentStage(run);
    const paused = runOverallStatus(run) === "paused";
    const meta = stage ? stageMeta(stage) : null;
    return (
        <div className="flex flex-col gap-xxs">
            <div className="flex items-center gap-xs">
                <Text size="sm" className={cn(paused ? "font-semibold" : "font-regular")}>
                    {meta ? `${meta.number} · ${meta.label}` : "Complete"}
                </Text>
                {meta ? <StageKindChip kind={meta.kind} /> : null}
            </div>
            {pips}
        </div>
    );
};

const ExtractionListContent = createReactiveComponent(function ExtractionListContent() {
    const { presenter } = useFeature(ExtractionListFeature);
    const { goToRoute } = useRouter();
    const { openDialog: openCreateDialog } = useCreateJobDialog();
    const toast = useToast();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const openJob = (jobId: string) => goToRoute(Routes.Job, { jobId });

    const startRun = async (jobId: string) => {
        try {
            const runId = await presenter.startRun(jobId);
            toast.showSuccessToast({ title: "Extraction run started." });
            goToRoute(Routes.Run, { runId });
        } catch (error) {
            toast.showWarningToast({
                title: "Could not start run",
                description: (error as Error).message
            });
        }
    };

    const rows: JobRow[] = useMemo(() => {
        const query = vm.search.trim().toLowerCase();
        const matched = vm.items.filter(item => {
            if (query && !`${item.job.name} ${item.job.siteUrl}`.toLowerCase().includes(query)) {
                return false;
            }
            if (vm.statusFilter !== "all" && runOverallStatus(item.latestRun) !== vm.statusFilter) {
                return false;
            }
            return true;
        });
        const sorted = [...matched].sort((a, b) => {
            if (a.job.pinned !== b.job.pinned) {
                return a.job.pinned ? -1 : 1;
            }
            if (vm.sort === "name") {
                return a.job.name.localeCompare(b.job.name);
            }
            return (b.latestRun?.createdOn ?? "").localeCompare(a.latestRun?.createdOn ?? "");
        });
        return sorted.map(item => ({
            ...item,
            id: item.job.id,
            name: item.job.name,
            siteUrl: item.job.siteUrl
        }));
    }, [vm.items, vm.search, vm.statusFilter, vm.sort]);

    const columns = useMemo(
        () => ({
            job: {
                header: "Job",
                cell: (item: JobRow) => <JobCell item={item} onOpen={() => openJob(item.job.id)} />,
                size: 280
            },
            status: {
                header: "Status",
                cell: (item: JobRow) => <StageStatus status={runOverallStatus(item.latestRun)} />,
                size: 150,
                enableSorting: false
            },
            stage: {
                header: "Current stage",
                cell: (item: JobRow) => <CurrentStageCell item={item} />,
                size: 220,
                enableSorting: false
            },
            pages: {
                header: "Pages",
                cell: (item: JobRow) => (
                    <Text size="sm" className="block text-right">
                        {item.latestRun ? item.latestRun.counts.pages : "—"}
                    </Text>
                ),
                size: 80
            },
            components: {
                header: "Components",
                cell: (item: JobRow) => (
                    <Text size="sm" className="block text-right">
                        {item.latestRun ? item.latestRun.counts.components : "—"}
                    </Text>
                ),
                size: 110
            },
            lastRun: {
                header: "Last run",
                cell: (item: JobRow) =>
                    item.latestRun ? (
                        <TimeAgo datetime={item.latestRun.createdOn} />
                    ) : (
                        <Text size="sm">—</Text>
                    ),
                size: 130
            },
            actions: {
                header: " ",
                cell: (item: JobRow) => (
                    <DropdownMenu
                        trigger={
                            <IconButton
                                icon={<MoreVerticalIcon />}
                                variant="ghost"
                                size="sm"
                                aria-label="Actions"
                            />
                        }
                    >
                        {item.latestRun ? (
                            <DropdownMenu.Item
                                icon={<OpenIcon />}
                                onClick={() => openJob(item.job.id)}
                                text="Open job"
                            />
                        ) : null}
                        <DropdownMenu.Item
                            icon={<PlayIcon />}
                            onClick={() => startRun(item.job.id)}
                            disabled={vm.startingJobId === item.job.id}
                            text="Start new run"
                        />
                        {/* Duplicate / delete need a backend mutation (not built — noted for W10). */}
                        <DropdownMenu.Item icon={<DuplicateIcon />} text="Duplicate" disabled />
                        <DropdownMenu.Item icon={<DeleteIcon />} text="Delete" disabled />
                    </DropdownMenu>
                ),
                size: 56,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [presenter, vm.startingJobId]
    );

    return (
        <>
            <div className="flex items-end justify-between px-md pt-md">
                <div className="flex flex-col gap-xxs">
                    <Heading level={3}>Components</Heading>
                    <Text className="text-neutral-strong">
                        Extract reusable components from a live site, stage by stage.
                    </Text>
                </div>
                <div className="flex items-center gap-sm">
                    <Tooltip
                        content="Settings are not available yet"
                        trigger={
                            <Button
                                variant="tertiary"
                                icon={<SettingsIcon />}
                                text="Settings"
                                disabled
                            />
                        }
                    />
                    <Button
                        variant="primary"
                        onClick={() => openCreateDialog()}
                        icon={<AddIcon />}
                        text="New extraction"
                    />
                </div>
            </div>

            <div className="flex items-center gap-lg border-b border-neutral-dimmed px-md">
                <TabItem label="Extractions" count={vm.items.length} active />
                <TabItem
                    label="Library"
                    count={vm.libraryCount}
                    muted
                    title="The component Library lives in the Components app"
                />
            </div>

            <div className="flex items-center gap-sm px-md py-sm">
                <div className="flex-1">
                    <Input
                        value={vm.search}
                        onChange={(value: string) => presenter.setSearch(value)}
                        placeholder="Search extractions"
                    />
                </div>
                <div className="w-44">
                    <Select
                        value={vm.statusFilter}
                        options={STATUS_OPTIONS}
                        onChange={(value: string) =>
                            presenter.setStatusFilter(value as StatusFilter)
                        }
                    />
                </div>
                <div className="w-40">
                    <Select
                        value={vm.sort}
                        options={SORT_OPTIONS}
                        onChange={(value: string) => presenter.setSort(value as ListSort)}
                        placeholder="Sort"
                    />
                </div>
            </div>
            <Separator />

            {!vm.loading && vm.items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-xxl">
                    <EmptyState
                        title="No extractions yet"
                        description="Point an extraction at a live site and Component Extraction turns its sections into reusable, theme-bound components."
                        actions={
                            <Button
                                variant="primary"
                                onClick={() => openCreateDialog()}
                                icon={<AddIcon />}
                                text="New extraction"
                            />
                        }
                    />
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-x-auto">
                    <div className="min-w-[900px]">
                        <Scrollbar>
                            <DataTable<JobRow>
                                columns={columns}
                                data={rows}
                                loading={vm.loading}
                                stickyHeader
                            />
                        </Scrollbar>
                    </div>
                </div>
            )}
        </>
    );
});

export const ExtractionListPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        ExtractionListFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <DialogsProvider>
                <div className="flex h-main-content flex-col">
                    <ExtractionListContent />
                </div>
            </DialogsProvider>
        </DiContainerProvider>
    );
};
