import React, { useCallback, useState } from "react";
import { css } from "emotion";
import dotProp from "dot-prop-immutable";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
import { useUi } from "@webiny/app/hooks/useUi";
import { validation } from "@webiny/validation";
import { WrapperWithFileUpload } from "../index";
// assets
import { ReactComponent as UploadFileIcon } from "@webiny/app-admin/assets/icons/file_upload.svg";
import { ReactComponent as LinkIcon } from "~/editor/assets/icons/link.svg";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importBlock");

const contentContainer = css`
    padding: 36px 0;
`;

const gridClass = css`
    &.mdc-layout-grid {
        padding-left: 0;
        padding-right: 0;
    }
`;

const separator = css`
    margin: 0 24px;
`;

export const importBlockDialogTitle = t`Import block`;

interface ImportBlockDialogContentProps {
    onFileLink: (url: string) => void;
}

export const ImportBlockDialogContent = ({ onFileLink }: ImportBlockDialogContentProps) => {
    const ui = useUi();
    const [showLink, setShowLink] = useState<boolean>(false);

    const setDialogStyles = useCallback(
        (style: React.CSSProperties) => {
            ui.setState(state => dotProp.set(state, "dialog.options.style", style));
        },
        [ui]
    );

    const closeDialog = useCallback(() => {
        ui.setState(state => ({ ...state, dialog: null }));
    }, [ui]);

    return (
        <div>
            <Typography use={"subtitle1"}>
                {t`You can import block(s) by either uploading a Webiny Block Export ZIP or by pasting export file URL.`}
            </Typography>

            {showLink ? (
                <Form
                    data={{ url: "" }}
                    onSubmit={data => {
                        closeDialog();
                        onFileLink(data["url"]);
                    }}
                >
                    {({ Bind, submit }) => (
                        <Grid className={gridClass}>
                            <Cell span={12}>
                                <Bind name={"url"} validators={validation.create("required,url")}>
                                    <Input
                                        description={t`The URL has to be public. We'll use it to download the export block data file.`}
                                        label={"File URL"}
                                        data-testid={"import-blocks.input-dialog.input-url"}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <ButtonSecondary
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                >
                                    Continue
                                </ButtonSecondary>
                            </Cell>
                        </Grid>
                    )}
                </Form>
            ) : (
                <div className={contentContainer}>
                    <WrapperWithFileUpload onSelect={onFileLink}>
                        {({ showFileManager }) => (
                            <ButtonSecondary
                                onClick={() => {
                                    showFileManager();
                                    setDialogStyles({ display: "none" });
                                }}
                            >
                                <ButtonIcon icon={<UploadFileIcon />} />
                                Upload File
                            </ButtonSecondary>
                        )}
                    </WrapperWithFileUpload>

                    <span className={separator}>
                        <Typography use={"overline"}>{t`Or`}</Typography>
                    </span>
                    <ButtonSecondary onClick={() => setShowLink(true)}>
                        <ButtonIcon icon={<LinkIcon />} />
                        Paste File URL
                    </ButtonSecondary>
                </div>
            )}
        </div>
    );
};

const useImportBlockDialog = () => {
    const { showDialog } = useDialog();

    return {
        showImportBlockDialog: (onFileLink?: (url: string) => void) => {
            showDialog(
                <ImportBlockDialogContent
                    onFileLink={url => {
                        if (!onFileLink) {
                            return;
                        }
                        onFileLink(url);
                    }}
                />,
                {
                    title: importBlockDialogTitle,
                    actions: {
                        cancel: { label: t`Cancel` }
                    },
                    dataTestId: "import-blocks.input-dialog"
                }
            );
        }
    };
};

export default useImportBlockDialog;
