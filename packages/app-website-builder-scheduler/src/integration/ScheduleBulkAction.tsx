import React, { useMemo } from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/calendar_month.svg";
import { Grid, Input, Tooltip } from "@webiny/admin-ui";
import { useApolloClient } from "@apollo/react-hooks";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { PageListConfig } from "@webiny/app-website-builder";
import { Bind } from "@webiny/form";
import { WbSchedulerPublishGraphQLGateway } from "~/adapters/index.js";
import type { PageDto } from "@webiny/app-website-builder/domain/Page/PageDto.js";
import type { CallbackParams } from "@webiny/app-admin";

const getPagesLabel = (count: number) => (count === 1 ? "1 page" : `${count} pages`);

const WB_PAGE_MODEL_ID = "wbPage";

export const ScheduleBulkAction = () => {
    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const dialog = useDialogs();
    const { showResultsDialog } = useDialog();

    const publishGateway = useMemo(() => new WbSchedulerPublishGraphQLGateway(client), [client]);

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openScheduleDialog = () => {
        dialog.showDialog({
            title: `Schedule publishing for ${pagesLabel}`,
            content: (
                <Grid>
                    <Grid.Column span={12}>
                        <Bind name={"scheduleOn"}>
                            {bind => (
                                <Input
                                    {...bind}
                                    title={"Schedule On"}
                                    label={"Schedule On"}
                                    size={"lg"}
                                    type={"datetime-local"}
                                    required
                                    autoFocus
                                />
                            )}
                        </Bind>
                    </Grid.Column>
                </Grid>
            ),
            acceptLabel: "Schedule",
            cancelLabel: "Discard",
            loadingLabel: "Scheduling...",
            onAccept: async (data: { scheduleOn?: string }) => {
                if (!data.scheduleOn) {
                    showSnackbar('Missing "Schedule On" date!');
                    return;
                }

                const scheduleOn = new Date(data.scheduleOn);

                await worker.processInSeries(async ({ item, report }: CallbackParams<PageDto>) => {
                    try {
                        await publishGateway.execute({
                            modelId: WB_PAGE_MODEL_ID,
                            id: item.id,
                            scheduleOn
                        });

                        report.success({
                            title: item.properties.title,
                            message: "Schedule successfully created."
                        });
                    } catch (e: any) {
                        report.error({
                            title: item.properties.title,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Schedule pages",
                    message: "Finished scheduling pages! See full report below:",
                    onCancel: worker.resetResults
                });
            }
        });
    };

    return (
        <Tooltip
            side={"bottom"}
            content={`Schedule publishing for ${pagesLabel}`}
            trigger={
                <ButtonDefault icon={<ScheduleIcon />} onAction={openScheduleDialog} size={"sm"}>
                    Schedule
                </ButtonDefault>
            }
        />
    );
};
