import React, { useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import { DialogsProvider } from "@webiny/app-admin/components/index.js";
import {
    Button,
    DataTable,
    DropdownMenu,
    Heading,
    IconButton,
    Scrollbar,
    Separator,
    Tag,
    Text,
    TimeAgo,
    useToast
} from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as OpenIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as PlayIcon } from "@webiny/icons/play_arrow.svg";
import { ExtractionListFeature } from "../feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { useCreateJobDialog } from "~/presentation/CreateJob/components/CreateJobDialog.js";
import { runStageLabel } from "~/shared/ledger.js";
import { Routes } from "~/routes.js";
import type { JobListItemDto } from "~/shared/types.js";

/**
 * The DataTable row. It needs an `id`, and its column keys must be keys of this type, so the job's
 * primitive fields are hoisted onto the row; the cells still read the full `job`/`latestRun`.
 */
type JobRow = JobListItemDto & { id: string; name: string; siteUrl: string };

const statusVariant = (status: string): React.ComponentProps<typeof Tag>["variant"] => {
    switch (status) {
        case "done":
            return "success";
        case "running":
            return "accent";
        case "failed":
            return "destructive";
        default:
            return "neutral-muted";
    }
};

const StatusCell = ({ item }: { item: JobListItemDto }) => {
    if (!item.latestRun) {
        return <Tag variant="neutral-muted" content="Not started" />;
    }
    return <Tag variant={statusVariant(item.latestRun.status)} content={item.latestRun.status} />;
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

    const rows: JobRow[] = vm.items.map(item => ({
        ...item,
        id: item.job.id,
        name: item.job.name,
        siteUrl: item.job.siteUrl
    }));

    const openLatestRun = (item: JobRow) => {
        if (item.latestRun) {
            goToRoute(Routes.Run, { runId: item.latestRun.id });
        }
    };

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

    const columns = useMemo(
        () => ({
            name: {
                header: "Name",
                cell: (item: JobRow) =>
                    item.latestRun ? (
                        <Text
                            className="cursor-pointer text-primary hover:underline"
                            onClick={() => openLatestRun(item)}
                        >
                            {item.job.name}
                        </Text>
                    ) : (
                        <Text>{item.job.name}</Text>
                    ),
                size: 200
            },
            siteUrl: {
                header: "Site",
                cell: (item: JobRow) => <Text size="sm">{item.job.siteUrl}</Text>,
                size: 240
            },
            status: {
                header: "Status",
                cell: (item: JobRow) => <StatusCell item={item} />,
                size: 120
            },
            stage: {
                header: "Stage",
                cell: (item: JobRow) => <Text size="sm">{runStageLabel(item.latestRun)}</Text>,
                size: 110
            },
            pages: {
                header: "Pages",
                cell: (item: JobRow) => (
                    <Text size="sm">{item.latestRun ? item.latestRun.counts.pages : "—"}</Text>
                ),
                size: 80
            },
            components: {
                header: "Components",
                cell: (item: JobRow) => (
                    <Text size="sm">{item.latestRun ? item.latestRun.counts.components : "—"}</Text>
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
                size: 140
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
                                onClick={() => openLatestRun(item)}
                                text="Open latest run"
                            />
                        ) : null}
                        <DropdownMenu.Item
                            icon={<PlayIcon />}
                            onClick={() => startRun(item.job.id)}
                            disabled={vm.startingJobId === item.job.id}
                            text="Start new run"
                        />
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

    if (!vm.loading && vm.items.length === 0) {
        return (
            <div className="flex-1 overflow-hidden">
                <div className="flex flex-col items-center justify-center h-full gap-md">
                    <Text className="text-neutral-strong">No extractions yet.</Text>
                    <Button
                        variant="primary"
                        onClick={() => openCreateDialog()}
                        icon={<AddIcon />}
                        text="New extraction"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden">
            <Scrollbar>
                <DataTable<JobRow>
                    columns={columns}
                    data={rows}
                    loading={vm.loading}
                    stickyHeader
                />
            </Scrollbar>
        </div>
    );
});

const ExtractionListHeader = () => {
    const { openDialog: openCreateDialog } = useCreateJobDialog();

    return (
        <div className="flex items-center justify-between py-sm px-md">
            <Heading level={5}>Component Extraction</Heading>
            <Button
                variant="primary"
                onClick={() => openCreateDialog()}
                icon={<AddIcon />}
                text="New extraction"
            />
        </div>
    );
};

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
                <div className="flex flex-col h-main-content">
                    <ExtractionListHeader />
                    <Separator />
                    <ExtractionListContent />
                </div>
            </DialogsProvider>
        </DiContainerProvider>
    );
};
