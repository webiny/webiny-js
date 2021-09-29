import React, { FunctionComponent, useCallback, useEffect, useState } from "react";
import get from "lodash/get";
import { useLazyQuery, useQuery } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { Typography } from "@webiny/ui/Typography";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import ImportPagesDetails from "./useImportPagesDetails";
import ProgressBar from "./ProgressBar";
import { LoadingDialog } from "./styledComponents";
import {
    GET_PAGE_IMPORT_EXPORT_TASK,
    GET_PAGE_IMPORT_EXPORT_TASK_BY_STATUS
} from "~/admin/graphql/pageImportExport.gql";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

const importPageDialogTitle = t`Import pages`;

const completionMessage = t`All pages have been imported`;
const progressMessage = t`Waiting for operation status`;

const INTERVAL = 0.5 * 1000;

const ImportPageLoadingDialogContent: FunctionComponent<{ taskId: string }> = ({ taskId }) => {
    const { showSnackbar } = useSnackbar();
    const [completed, setCompleted] = useState<boolean>(false);

    const { data } = useQuery(GET_PAGE_IMPORT_EXPORT_TASK, {
        variables: {
            id: taskId
        },
        skip: taskId === null,
        fetchPolicy: "network-only",
        pollInterval: completed ? 0 : INTERVAL,
        notifyOnNetworkStatusChange: true
    });

    const [getSubTasks, getSubTasksQuery] = useLazyQuery(GET_PAGE_IMPORT_EXPORT_TASK_BY_STATUS, {
        variables: {
            id: taskId,
            status: "completed"
        }
    });

    const pollExportPageTaskStatus = useCallback(response => {
        const { error, data } = get(response, "pageBuilder.getPageImportExportTask", {});
        if (error) {
            return showSnackbar(error.message);
        }

        // Handler failed task
        if (data && data.status === "failed") {
            setCompleted(true);
            showSnackbar("Error: Failed to export the page!");
            // TODO: @ashutosh show an informative dialog about error.
        }

        if (data && data.status === "completed") {
            setCompleted(true);
            getSubTasks();
        }
    }, []);

    // This component will remain as long as we stick to `/page-builder/pages` route.
    useEffect(() => {
        if (!data) {
            return;
        }
        pollExportPageTaskStatus(data);
    }, [data]);

    const { status, stats } = get(data, "pageBuilder.getPageImportExportTask.data", {
        status: "pending",
        stats: null
    });

    return (
        <LoadingDialog.Wrapper>
            <LoadingDialog.WrapperLeft>
                <LoadingDialog.UploadIllustration />
            </LoadingDialog.WrapperLeft>
            <LoadingDialog.WrapperRight>
                {status === "completed" ? (
                    <LoadingDialog.TitleContainer>
                        <LoadingDialog.CheckMarkIcon />
                        <Typography use={"subtitle1"}>{completionMessage}</Typography>
                    </LoadingDialog.TitleContainer>
                ) : (
                    <LoadingDialog.TitleContainer>
                        <LoadingDialog.Pulse>
                            <div className="inner" />
                        </LoadingDialog.Pulse>
                        <Typography use={"subtitle1"}>{progressMessage}</Typography>
                    </LoadingDialog.TitleContainer>
                )}

                <LoadingDialog.StatsContainer>
                    <LoadingDialog.StatusContainer>
                        <LoadingDialog.StatusTitle use={"subtitle2"}>
                            {t`Status`}
                        </LoadingDialog.StatusTitle>
                        <LoadingDialog.StatusBody use={"body2"}>{status}</LoadingDialog.StatusBody>
                    </LoadingDialog.StatusContainer>
                    {stats && (
                        <LoadingDialog.ProgressContainer>
                            <LoadingDialog.StatusTitle use={"subtitle2"}>
                                {t`{completed} of {total} completed`({
                                    completed: stats.completed,
                                    total: stats.total
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
                <ImportPagesDetails
                    loading={getSubTasksQuery.loading}
                    data={getSubTasksQuery.data}
                />
            </LoadingDialog.WrapperRight>
        </LoadingDialog.Wrapper>
    );
};

const useImportPageLoadingDialog = () => {
    const { showDialog } = useDialog();

    return {
        showImportPageLoadingDialog: props => {
            showDialog(<ImportPageLoadingDialogContent {...props} />, {
                title: importPageDialogTitle,
                actions: {
                    accept: { label: t`Continue`, onClick: () => window.location.reload() }
                }
            });
        }
    };
};

export default useImportPageLoadingDialog;
