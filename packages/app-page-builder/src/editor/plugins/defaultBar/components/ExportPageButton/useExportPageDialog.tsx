import React, { useEffect } from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { ButtonIcon, ButtonSecondary, CopyButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";

import { usePageBuilder } from "~/hooks/usePageBuilder";
import { ReactComponent as FileDownloadIcon } from "~/editor/assets/icons/file_download_black_24dp.svg";
import ExportPageLoadingDialogContent from "./ExportPageLoadingDialogContent";
import useExportPage from "./useExportPage";
import { PbListPagesWhereInput } from "~/admin/graphql/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportPageButton");

const confirmationMessageStyles = css`
    width: 600px;
`;

const linkWrapper = css`
    display: flex;
    background-color: var(--mdc-theme-background);

    & .link-text {
        padding: 8px 0 8px 16px;
        width: 100%;
        overflow: hidden;
    }
`;

const gridClass = css`
    &.mdc-layout-grid {
        padding-top: 0;
        padding-bottom: 0;
    }
`;

const spinnerWrapper = css`
    position: relative;
    width: 100%;
    height: 180px;
`;

export interface ExportPagesDialogProps {
    ids?: string[];
    where?: PbListPagesWhereInput;
    sort?: string;
    search?: { query: string };
}

const ExportPageLoadingDialogMessage = (props: ExportPagesDialogProps) => {
    const { exportPage } = useExportPage();
    const {
        exportPageData: { revisionType }
    } = usePageBuilder();

    const { ids, sort, ...variables } = props;

    useEffect(() => {
        exportPage({
            variables: {
                ...variables,
                where: {
                    ...variables.where,
                    pid_in: ids ? ids : undefined
                },
                revisionType,
                sort: sort ? [sort] : undefined
            }
        });
    }, []);

    return (
        <div className={confirmationMessageStyles}>
            <div className={spinnerWrapper}>
                <CircularProgress label={t`Preparing your export...`} />
            </div>
        </div>
    );
};

interface ExportPageDialogProps {
    exportUrl: string;
}

const ExportPageDialogMessage = ({ exportUrl }: ExportPageDialogProps) => {
    const { showSnackbar } = useSnackbar();

    return (
        <div className={confirmationMessageStyles}>
            <Grid style={{ paddingTop: 0 }}>
                <Cell span={12}>
                    <Typography use={"subtitle1"}>{t`Copy the export URL:`}</Typography>
                </Cell>
                <Cell span={12}>
                    <div className={linkWrapper}>
                        <Typography
                            use={"body2"}
                            className={"link-text"}
                            data-testid={"pb-pages-export-dialog-export-url"}
                        >
                            {exportUrl}
                        </Typography>
                        <span>
                            <CopyButton
                                data-testid={"export-pages.export-ready-dialog.copy-button"}
                                value={exportUrl}
                                onCopy={() => showSnackbar("Successfully copied!")}
                            />
                        </span>
                    </div>
                </Cell>
            </Grid>
            <Grid className={gridClass}>
                <Cell span={12}>
                    <Typography use={"subtitle1"}>{t`Or download the ZIP archive:`}</Typography>
                </Cell>
                <Cell span={12}>
                    <ButtonSecondary
                        onClick={() => {
                            // Download the ZIP
                            window.open(exportUrl, "_blank", "noopener");
                        }}
                    >
                        <ButtonIcon icon={<FileDownloadIcon />} />
                        Download
                    </ButtonSecondary>
                </Cell>
            </Grid>
        </div>
    );
};

interface UseExportPageDialog {
    showExportPageContentDialog: (props: ExportPageDialogProps) => void;
    showExportPageLoadingDialog: (taskId: string) => void;
    showExportPageInitializeDialog: (props: ExportPagesDialogProps) => void;
    hideDialog: () => void;
}

const useExportPageDialog = (): UseExportPageDialog => {
    const { showDialog, hideDialog } = useDialog();

    return {
        showExportPageContentDialog: props => {
            showDialog(<ExportPageDialogMessage {...props} />, {
                title: t`Your export is now ready!`,
                actions: {
                    cancel: { label: t`Close` }
                },
                dataTestId: "export-pages.export-ready-dialog"
            });
        },
        showExportPageLoadingDialog: taskId => {
            showDialog(<ExportPageLoadingDialogContent taskId={taskId} />, {
                title: t`Preparing your export...`,
                actions: {
                    cancel: { label: t`Cancel` }
                },
                dataTestId: "export-pages.loading-dialog"
            });
        },
        showExportPageInitializeDialog: props => {
            showDialog(<ExportPageLoadingDialogMessage {...props} />, {
                title: t`Preparing your export...`,
                actions: {
                    cancel: { label: t`Cancel` }
                },
                dataTestId: "export-pages.initial-dialog"
            });
        },
        hideDialog
    };
};

export default useExportPageDialog;
