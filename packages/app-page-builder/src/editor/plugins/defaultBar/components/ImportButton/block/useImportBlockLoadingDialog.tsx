import React, { useCallback, useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { Typography } from "@webiny/ui/Typography";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import ImportBlocksDetails from "./useImportBlocksDetails";
import ProgressBar from "../ProgressBar";
import { LoadingDialog } from "../styledComponents";
import {
    GET_BLOCK_IMPORT_EXPORT_TASK,
    LIST_BLOCK_IMPORT_EXPORT_SUB_TASKS,
    GetBlockImportExportTaskResponse
} from "~/admin/graphql/blockImportExport.gql";
import { ImportExportTaskStatus } from "~/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importBlock");

const importBlockDialogTitle = t`Import blocks`;

const completionMessage = t`All blocks have been imported`;
const errorMessage = t`Failed to import blocks`;
const pendingMessage = t`Waiting for operation status`;
const processingMessage = t`Importing blocks`;

const INTERVAL = 0.5 * 1000;

const MESSAGES: Record<string, string> = {
    [ImportExportTaskStatus.COMPLETED]: completionMessage,
    [ImportExportTaskStatus.PROCESSING]: processingMessage,
    [ImportExportTaskStatus.PENDING]: pendingMessage
};

interface ImportBlockLoadingDialogContentProps {
    taskId: string;
}
const ImportBlockLoadingDialogContent = ({ taskId }: ImportBlockLoadingDialogContentProps) => {
    const { showSnackbar } = useSnackbar();
    const [completed, setCompleted] = useState<boolean>(false);
    const [error, setError] = useState<Record<string, string> | null>(null);

    const { data } = useQuery<GetBlockImportExportTaskResponse>(GET_BLOCK_IMPORT_EXPORT_TASK, {
        variables: {
            id: taskId
        },
        skip: taskId === null,
        fetchPolicy: "network-only",
        pollInterval: completed ? 0 : INTERVAL,
        notifyOnNetworkStatusChange: true
    });

    const [getSubTasks, getSubTasksQuery] = useLazyQuery(LIST_BLOCK_IMPORT_EXPORT_SUB_TASKS, {
        variables: {
            id: taskId,
            status: "completed"
        }
    });

    const pollExportBlockTaskStatus = useCallback((response: GetBlockImportExportTaskResponse) => {
        const { error, data } = response.pageBuilder.getImportExportTask || {};
        if (error) {
            return showSnackbar(error.message);
        }

        // Handler failed task
        if (data && data.status === "failed") {
            setCompleted(true);
            showSnackbar("Error: Failed to import blocks");
            setError(data.error);
        }

        if (data && data.status === "completed") {
            setCompleted(true);
            getSubTasks();
        }
    }, []);

    useEffect(() => {
        if (!data) {
            return;
        }
        pollExportBlockTaskStatus(data);
    }, [data]);

    const { status, stats } = data?.pageBuilder.getImportExportTask.data || {
        status: "pending",
        stats: null
    };

    return (
        <LoadingDialog.Wrapper>
            <LoadingDialog.WrapperLeft>
                <LoadingDialog.UploadIllustration />
            </LoadingDialog.WrapperLeft>
            <LoadingDialog.WrapperRight>
                {error ? (
                    <LoadingDialog.TitleContainer>
                        <LoadingDialog.CancelIcon />
                        <Typography use={"subtitle1"}>{errorMessage}</Typography>
                    </LoadingDialog.TitleContainer>
                ) : status === "completed" ? (
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
                <ImportBlocksDetails
                    loading={getSubTasksQuery.loading}
                    result={getSubTasksQuery.data}
                />
            </LoadingDialog.WrapperRight>
        </LoadingDialog.Wrapper>
    );
};

interface UseImportBlockLoadingDialogCallableResponse {
    showImportBlockLoadingDialog: (props: ImportBlockLoadingDialogContentProps) => void;
}
const useImportBlockLoadingDialog = (): UseImportBlockLoadingDialogCallableResponse => {
    const { showDialog } = useDialog();

    return {
        showImportBlockLoadingDialog: props => {
            showDialog(<ImportBlockLoadingDialogContent {...props} />, {
                title: importBlockDialogTitle,
                actions: {
                    accept: { label: t`Continue`, onClick: () => window.location.reload() }
                },
                dataTestId: "import-blocks.loading-dialog"
            });
        }
    };
};

export default useImportBlockLoadingDialog;
