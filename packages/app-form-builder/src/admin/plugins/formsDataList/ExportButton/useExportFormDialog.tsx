import React, { useEffect } from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { ButtonIcon, ButtonSecondary, CopyButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";

import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { ReactComponent as FileDownloadIcon } from "@material-design-icons/svg/round/download.svg";
import ExportFormLoadingDialogContent from "./ExportFormLoadingDialogContent";
import useExportForm from "./useExportForm";

const t = i18n.ns("app-form-builder/editor/plugins/defaultBar/exportFormButton");

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

export interface ExportFormsDialogProps {
    ids?: string[];
    where?: Record<string, any>;
    sort?: string;
    search?: { query: string };
}

const ExportFormLoadingDialogMessage = (props: ExportFormsDialogProps) => {
    const { exportForm } = useExportForm();
    const {
        exportPageData: { revisionType }
    } = usePageBuilder();

    useEffect(() => {
        exportForm({
            variables: {
                revisionType,
                ...props
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

interface ExportFormDialogProps {
    exportUrl: string;
}

const ExportFormDialogMessage = ({ exportUrl }: ExportFormDialogProps) => {
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
                            data-testid={"fb-forms-export-dialog-export-url"}
                        >
                            {exportUrl}
                        </Typography>
                        <span>
                            <CopyButton
                                data-testid={"export-forms.export-ready-dialog.copy-button"}
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

interface UseExportFormDialog {
    showExportFormContentDialog: (props: ExportFormDialogProps) => void;
    showExportFormLoadingDialog: (taskId: string) => void;
    showExportFormInitializeDialog: (props: ExportFormsDialogProps) => void;
    hideDialog: () => void;
}

const useExportFormDialog = (): UseExportFormDialog => {
    const { showDialog, hideDialog } = useDialog();

    return {
        showExportFormContentDialog: props => {
            showDialog(<ExportFormDialogMessage {...props} />, {
                title: t`Your export is now ready!`,
                actions: {
                    cancel: { label: t`Close` }
                },
                dataTestId: "export-forms.export-ready-dialog"
            });
        },
        showExportFormLoadingDialog: taskId => {
            showDialog(<ExportFormLoadingDialogContent taskId={taskId} />, {
                title: t`Preparing your export...`,
                actions: {
                    cancel: { label: t`Cancel` }
                },
                dataTestId: "export-forms.loading-dialog"
            });
        },
        showExportFormInitializeDialog: props => {
            showDialog(<ExportFormLoadingDialogMessage {...props} />, {
                title: t`Preparing your export...`,
                actions: {
                    cancel: { label: t`Cancel` }
                },
                dataTestId: "export-forms.initial-dialog"
            });
        },
        hideDialog
    };
};

export default useExportFormDialog;
