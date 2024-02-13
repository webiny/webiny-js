import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { Typography } from "@webiny/ui/Typography";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import ProgressBar from "../ProgressBar";
import { LoadingDialog } from "../styledComponents";
import {
    GET_PAGES_IMPORT_TASK,
    GetPagesImportTaskResponse,
    GetPagesImportTaskVariables,
    LIST_IMPORTED_PAGES,
    ListImportedPagesResponse,
    ListImportedPagesVariables
} from "~/admin/graphql/pageImportExport.gql";
import { PbTaskStatus } from "~/admin/graphql/types";
import ImportPagesDetails from "./useImportPagesDetails";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

const importPageDialogTitle = t`Import pages`;

const completionMessage = t`All pages have been imported`;
const errorMessage = t`Failed to import pages`;
const pendingMessage = t`Waiting for operation status`;
const processingMessage = t`Importing pages`;
const abortedMessage = t`Importing pages aborted`;

const INTERVAL = 0.5 * 1000;

const MESSAGES: Record<PbTaskStatus, string> = {
    [PbTaskStatus.success]: completionMessage,
    [PbTaskStatus.running]: processingMessage,
    [PbTaskStatus.pending]: pendingMessage,
    [PbTaskStatus.failed]: errorMessage,
    [PbTaskStatus.aborted]: abortedMessage
};

interface ImportPageLoadingDialogContentProps {
    taskId: string;
}
const ImportPageLoadingDialogContent = ({ taskId }: ImportPageLoadingDialogContentProps) => {
    const { showSnackbar } = useSnackbar();
    const [completed, setCompleted] = useState<boolean>(false);
    const [error, setError] = useState<Partial<Error> | null | undefined>(null);

    const { data } = useQuery<GetPagesImportTaskResponse, GetPagesImportTaskVariables>(
        GET_PAGES_IMPORT_TASK,
        {
            variables: {
                id: taskId
            },
            skip: taskId === null,
            fetchPolicy: "network-only",
            pollInterval: completed ? 0 : INTERVAL,
            notifyOnNetworkStatusChange: true
        }
    );

    const pollExportPageTaskStatus = useCallback((response: GetPagesImportTaskResponse) => {
        const { error, data } = response.pageBuilder.getImportPagesTask;
        if (error) {
            return showSnackbar(error.message);
        }

        // Handler failed task
        if (data?.status === "failed" || data?.data?.error) {
            setCompleted(true);
            showSnackbar("Error: Failed to import pages");
            // TODO: @ashutosh show an informative dialog about error.
            setError(data?.data?.error);
        }

        if (data?.status === "success") {
            setCompleted(true);
        }
    }, []);

    // This component will remain as long as we stick to `/page-builder/pages` route.
    useEffect(() => {
        if (!data) {
            return;
        }
        pollExportPageTaskStatus(data);
    }, [data]);

    const { status, stats } = data?.pageBuilder.getImportPagesTask.data || {
        status: "pending",
        stats: null
    };

    const listImportedPages = useQuery<ListImportedPagesResponse, ListImportedPagesVariables>(
        LIST_IMPORTED_PAGES,
        {
            skip: status !== PbTaskStatus.success || !taskId,
            variables: {
                taskId
            }
        }
    );

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
                <ImportPagesDetails
                    loading={listImportedPages.loading}
                    result={listImportedPages.data}
                />
            </LoadingDialog.WrapperRight>
        </LoadingDialog.Wrapper>
    );
};

interface UseImportPageLoadingDialogCallableResponse {
    showImportPageLoadingDialog: (props: ImportPageLoadingDialogContentProps) => void;
}
const useImportPageLoadingDialog = (): UseImportPageLoadingDialogCallableResponse => {
    const { showDialog } = useDialog();

    return {
        showImportPageLoadingDialog: props => {
            showDialog(<ImportPageLoadingDialogContent {...props} />, {
                title: importPageDialogTitle,
                actions: {
                    accept: { label: t`Continue`, onClick: () => window.location.reload() }
                },
                dataTestId: "import-pages.loading-dialog"
            });
        }
    };
};

export default useImportPageLoadingDialog;
