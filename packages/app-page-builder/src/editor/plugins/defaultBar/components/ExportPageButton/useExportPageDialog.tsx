import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { ButtonIcon, ButtonSecondary, CopyButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";

import { ReactComponent as FileDownloadIcon } from "~/editor/assets/icons/file_download_black_24dp.svg";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

const confirmationMessageStyles = css`
    max-width: 600px;
`;

const spinnerWrapper = css`
    position: relative;
    width: 400px;
    height: 180px;
`;

const linkWrapper = css`
    position: relative;
    background-color: var(--mdc-theme-background);

    & .link-text {
        display: inline-block;
        padding: 8px 16px;
    }

    & .copy-button__wrapper {
        position: absolute;
        top: 4px;
        right: 18px;
    }
`;

const gridClass = css`
    &.mdc-layout-grid {
        padding-top: 0;
        padding-bottom: 0;
    }
`;

const ExportPageLoadingDialogMessage: React.FunctionComponent = () => {
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

const ExportPageDialogMessage: React.FunctionComponent<ExportPageDialogProps> = ({ exportUrl }) => {
    const { showSnackbar } = useSnackbar();

    return (
        <div className={confirmationMessageStyles}>
            <Grid style={{ paddingTop: 0 }}>
                <Cell span={12}>
                    <Typography use={"subtitle1"}>{t`Copy the export URL:`}</Typography>
                </Cell>
                <Cell span={12}>
                    <div className={linkWrapper}>
                        <Typography use={"body2"} className={"link-text"}>
                            {exportUrl}
                        </Typography>
                        <span className={"copy-button__wrapper"}>
                            <CopyButton
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

const useExportPageDialog = () => {
    const { showDialog, hideDialog } = useDialog();

    return {
        showExportPageContentDialog: (props: ExportPageDialogProps) => {
            showDialog(<ExportPageDialogMessage {...props} />, {
                title: t`Your export is now ready!`,
                actions: {
                    cancel: { label: t`Close` }
                }
            });
        },
        showExportPageLoadingDialog: (onCancel: Function) => {
            showDialog(<ExportPageLoadingDialogMessage />, {
                title: t`Export page`,
                actions: {
                    cancel: { label: t`Cancel`, onClick: onCancel }
                }
            });
        },
        hideDialog
    };
};

export default useExportPageDialog;
