import React, { useCallback, useEffect, useState } from "react";
import get from "lodash/get";
import { useLazyQuery, useQuery } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { Typography } from "@webiny/ui/Typography";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import ImportTemplatesDetails from "./useImportTemplatesDetails";
import ProgressBar from "../ProgressBar";
import { LoadingDialog } from "../styledComponents";
import {
    GET_TEMPLATE_IMPORT_EXPORT_TASK,
    LIST_TEMPLATE_IMPORT_EXPORT_SUB_TASKS
} from "~/admin/graphql/templateImportExport.gql";
import { ImportExportTaskStatus } from "~/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importTemplate");

const importTemplateDialogTitle = t`Import templates`;

const completionMessage = t`All templates have been imported`;
const errorMessage = t`Failed to import templates`;
const pendingMessage = t`Waiting for operation status`;
const processingMessage = t`Importing templates`;

const INTERVAL = 0.5 * 1000;

const MESSAGES: Record<string, string> = {
    [ImportExportTaskStatus.COMPLETED]: completionMessage,
    [ImportExportTaskStatus.PROCESSING]: processingMessage,
    [ImportExportTaskStatus.PENDING]: pendingMessage
};

interface ImportTemplateLoadingDialogContentProps {
    taskId: string;
}
const ImportTemplateLoadingDialogContent: React.VFC<ImportTemplateLoadingDialogContentProps> = ({
    taskId
}) => {
    const { showSnackbar } = useSnackbar();
    const [completed, setCompleted] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const { data } = useQuery(GET_TEMPLATE_IMPORT_EXPORT_TASK, {
        variables: {
            id: taskId
        },
        skip: taskId === null,
        fetchPolicy: "network-only",
        pollInterval: completed ? 0 : INTERVAL,
        notifyOnNetworkStatusChange: true
    });

    const [getSubTasks, getSubTasksQuery] = useLazyQuery(LIST_TEMPLATE_IMPORT_EXPORT_SUB_TASKS, {
        variables: {
            id: taskId,
            status: "completed"
        }
    });

    const pollExportTemplateTaskStatus = useCallback(response => {
        const { error, data } = get(response, "pageBuilder.getImportExportTask", {});
        if (error) {
            return showSnackbar(error.message);
        }

        // Handler failed task
        if (data && data.status === "failed") {
            setCompleted(true);
            showSnackbar("Error: Failed to import templates");
            // TODO: @ashutosh show an informative dialog about error.
            setError(data.error);
        }

        if (data && data.status === "completed") {
            setCompleted(true);
            getSubTasks();
        }
    }, []);

    // This component will remain as long as we stick to `/page-builder/templates` route.
    useEffect(() => {
        if (!data) {
            return;
        }
        pollExportTemplateTaskStatus(data);
    }, [data]);

    const { status, stats } = get(data, "pageBuilder.getImportExportTask.data", {
        status: "pending",
        stats: null
    });

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
                <ImportTemplatesDetails
                    loading={getSubTasksQuery.loading}
                    result={getSubTasksQuery.data}
                />
            </LoadingDialog.WrapperRight>
        </LoadingDialog.Wrapper>
    );
};

interface UseImportTemplateLoadingDialogCallableResponse {
    showImportTemplateLoadingDialog: (props: ImportTemplateLoadingDialogContentProps) => void;
}
const useImportTemplateLoadingDialog = (): UseImportTemplateLoadingDialogCallableResponse => {
    const { showDialog } = useDialog();

    return {
        showImportTemplateLoadingDialog: props => {
            showDialog(<ImportTemplateLoadingDialogContent {...props} />, {
                title: importTemplateDialogTitle,
                actions: {
                    accept: { label: t`Continue`, onClick: () => window.location.reload() }
                },
                dataTestId: "import-templates.loading-dialog"
            });
        }
    };
};

export default useImportTemplateLoadingDialog;
