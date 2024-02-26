import React, { useEffect } from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { ButtonIcon, ButtonSecondary, CopyButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { ReactComponent as FileDownloadIcon } from "~/editor/assets/icons/file_download_black_24dp.svg";
import ExportBlockLoadingDialogContent from "./ExportBlockLoadingDialogContent";
import useExportBlock from "./useExportBlock";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportBlockButton");

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

interface ExportBlockLoadingDialogProps {
    ids?: string[];
    where?: Record<string, any>;
}

const ExportBlockLoadingDialogMessage = (props: ExportBlockLoadingDialogProps) => {
    const { exportBlock } = useExportBlock();

    useEffect(() => {
        exportBlock({ variables: { ...props } });
    }, []);

    return (
        <div className={confirmationMessageStyles}>
            <div className={spinnerWrapper}>
                <CircularProgress label={t`Preparing your export...`} />
            </div>
        </div>
    );
};

interface ExportBlockDialogProps {
    exportUrl: string;
}

const ExportBlockDialogMessage = ({ exportUrl }: ExportBlockDialogProps) => {
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
                            data-testid={"pb-blocks-export-dialog-export-url"}
                        >
                            {exportUrl}
                        </Typography>
                        <span>
                            <CopyButton
                                data-testid={"export-blocks.export-ready-dialog.copy-button"}
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

interface UseExportBlockDialog {
    showExportBlockContentDialog: (props: ExportBlockDialogProps) => void;
    showExportBlockLoadingDialog: (taskId: string) => void;
    showExportBlockInitializeDialog: (props: ExportBlockLoadingDialogProps) => void;
    hideDialog: () => void;
}

const useExportBlockDialog = (): UseExportBlockDialog => {
    const { showDialog, hideDialog } = useDialog();

    return {
        showExportBlockContentDialog: props => {
            showDialog(<ExportBlockDialogMessage {...props} />, {
                title: t`Your export is now ready!`,
                actions: {
                    cancel: { label: t`Close` }
                },
                dataTestId: "export-blocks.export-ready-dialog"
            });
        },
        showExportBlockLoadingDialog: taskId => {
            showDialog(<ExportBlockLoadingDialogContent taskId={taskId} />, {
                title: t`Preparing your export...`,
                actions: {
                    cancel: { label: t`Cancel` }
                },
                dataTestId: "export-blocks.loading-dialog"
            });
        },
        showExportBlockInitializeDialog: props => {
            showDialog(<ExportBlockLoadingDialogMessage {...props} />, {
                title: t`Preparing your export...`,
                actions: {
                    cancel: { label: t`Cancel` }
                },
                dataTestId: "export-blocks.initial-dialog"
            });
        },
        hideDialog
    };
};

export default useExportBlockDialog;
