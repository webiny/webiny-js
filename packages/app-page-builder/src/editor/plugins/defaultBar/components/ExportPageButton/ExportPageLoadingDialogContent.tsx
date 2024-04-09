import React, { useCallback, useEffect, useState } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery } from "@apollo/react-hooks";
import {
    GET_PAGE_EXPORT_TASK,
    GetPageExportTaskResponse,
    GetPageExportTaskVariables
} from "~/admin/graphql/pageImportExport.gql";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { LoadingDialog } from "../ImportButton/styledComponents";
import ProgressBar from "../ImportButton/ProgressBar";
import useExportPageDialog from "./useExportPageDialog";
import { ImportExportTaskStatus, PbErrorResponse } from "~/types";
import { PbTaskStatus } from "~/admin/graphql/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

const completionMessage = t`All pages have been exported`;
const errorMessage = t`Failed to import pages`;
const pendingMessage = t`Waiting for operation status`;
const processingMessage = t`Exporting pages`;
const abortedMessage = t`Importing pages aborted`;

const INTERVAL = 1000;

const MESSAGES: Record<PbTaskStatus, string> = {
    [PbTaskStatus.success]: completionMessage,
    [PbTaskStatus.running]: processingMessage,
    [PbTaskStatus.pending]: pendingMessage,
    [PbTaskStatus.failed]: errorMessage,
    [PbTaskStatus.aborted]: abortedMessage
};

interface ExportPageLoadingDialogContent {
    taskId: string;
}

const ExportPageLoadingDialogContent = ({ taskId }: ExportPageLoadingDialogContent) => {
    const [completed, setCompleted] = useState<boolean>(false);
    const [error, setError] = useState<PbErrorResponse | undefined | null>(null);
    const { showSnackbar } = useSnackbar();
    const { showExportPageContentDialog } = useExportPageDialog();

    const { data } = useQuery<GetPageExportTaskResponse, GetPageExportTaskVariables>(
        GET_PAGE_EXPORT_TASK,
        {
            variables: {
                id: taskId
            },
            skip: !taskId,
            fetchPolicy: "network-only",
            pollInterval: completed ? 0 : INTERVAL,
            notifyOnNetworkStatusChange: true
        }
    );

    const pollExportPageTaskStatus = useCallback((response: GetPageExportTaskResponse) => {
        const { error, data } = response.pageBuilder.getExportPagesTask;
        if (error) {
            showSnackbar(error.message);
            return;
        }

        // Handler failed task
        if (data && data.status === PbTaskStatus.failed) {
            setCompleted(true);
            showSnackbar("Error: Failed to export pages!");
            setError(data.data?.error);
        }

        if (data && data.status === PbTaskStatus.success) {
            setCompleted(true);

            if (!data.data?.url) {
                showSnackbar("Missing exported files URL! Please check task logs.");
                return;
            }
            showExportPageContentDialog({ exportUrl: data.data.url });
        }
    }, []);

    // This component will remain as long as we stick to `/page-builder/pages` route.
    useEffect(() => {
        if (!data) {
            return;
        }
        pollExportPageTaskStatus(data);
    }, [data]);

    const { status = ImportExportTaskStatus.PENDING, stats } =
        data?.pageBuilder.getExportPagesTask.data || {};

    return (
        <LoadingDialog.Wrapper>
            <LoadingDialog.WrapperLeft>
                <LoadingDialog.ExportIllustration />
            </LoadingDialog.WrapperLeft>
            <LoadingDialog.WrapperRight>
                {error ? (
                    <LoadingDialog.TitleContainer>
                        <LoadingDialog.CancelIcon />
                        <Typography use={"subtitle1"}>{errorMessage}</Typography>
                    </LoadingDialog.TitleContainer>
                ) : status === PbTaskStatus.success ? (
                    <LoadingDialog.TitleContainer>
                        <LoadingDialog.CheckMarkIcon />
                        <Typography use={"subtitle1"}>{MESSAGES[status]}</Typography>
                    </LoadingDialog.TitleContainer>
                ) : (
                    <LoadingDialog.TitleContainer>
                        <LoadingDialog.Pulse>
                            <div className="inner" />
                        </LoadingDialog.Pulse>
                        <Typography use={"subtitle1"}>{MESSAGES[status]}</Typography>
                    </LoadingDialog.TitleContainer>
                )}

                <LoadingDialog.StatsContainer>
                    {error && (
                        <LoadingDialog.StatusContainer>
                            <LoadingDialog.StatusTitle use={"body2"}>
                                {t`Error`}
                            </LoadingDialog.StatusTitle>
                            <LoadingDialog.StatusBody use={"body2"}>
                                {error.message}
                            </LoadingDialog.StatusBody>
                        </LoadingDialog.StatusContainer>
                    )}
                    {stats && (
                        <LoadingDialog.ProgressContainer>
                            <LoadingDialog.StatusTitle use={"body2"}>
                                {t`{completed} of {total} completed`({
                                    completed: `${stats.completed}`,
                                    total: `${stats.total}`
                                })}
                            </LoadingDialog.StatusTitle>
                            <ProgressBar
                                value={stats.completed}
                                max={stats.total}
                                color={"var(--mdc-theme-secondary)"}
                                width={"100%"}
                            />
                        </LoadingDialog.ProgressContainer>
                    )}
                </LoadingDialog.StatsContainer>
            </LoadingDialog.WrapperRight>
        </LoadingDialog.Wrapper>
    );
};

export default ExportPageLoadingDialogContent;
