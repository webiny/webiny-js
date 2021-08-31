import React, { useCallback, useState } from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { useUi } from "@webiny/app/hooks/useUi";

import { ReactComponent as UploadFileIcon } from "../icons/file_upload.svg";
import { ReactComponent as LinkIcon } from "~/editor/assets/icons/link.svg";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

const confirmationMessageStyles = css({
    "& code": {
        backgroundColor: "var(--mdc-theme-background)",
        padding: "0px 8px"
    }
});

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

export const importPageDialogTitle = t`Import page`;

export const ImportPageDialogMessage = ({ onUploadFile, onPasteFileLink }) => {
    const ui = useUi();
    const [showLink, setShowLink] = useState<boolean>(false);

    const hideDialog = useCallback(() => {
        ui.setState(state => ({ ...state, dialog: null }));
    }, [ui]);

    return (
        <div className={confirmationMessageStyles}>
            <Typography use={"subtitle1"}>
                {t`You can import page by either uploading a Webiny Page Export ZIP or by pasting export file URL.`}
            </Typography>

            {showLink ? (
                <Form
                    data={{ url: "" }}
                    onSubmit={data => {
                        if (typeof onPasteFileLink === "function") {
                            hideDialog();
                            onPasteFileLink(data.url);
                        }
                    }}
                >
                    {({ Bind, submit }) => (
                        <Grid className={gridClass}>
                            <Cell span={12}>
                                <Bind name={"url"} validators={validation.create("required,url")}>
                                    <Input
                                        description={t`The URL has to be public. We'll use it to download the export page data file.`}
                                        label={"File URL"}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <ButtonSecondary onClick={submit}>Continue</ButtonSecondary>
                            </Cell>
                        </Grid>
                    )}
                </Form>
            ) : (
                <div className={contentContainer}>
                    <ButtonSecondary
                        onClick={() => {
                            hideDialog();
                            onUploadFile();
                        }}
                    >
                        <ButtonIcon icon={<UploadFileIcon />} />
                        Upload File
                    </ButtonSecondary>
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

const useImportPageDialog = () => {
    const { showDialog } = useDialog();

    return {
        showImportPageDialog: (onUploadFile = null, onPasteFileLink = null) => {
            showDialog(
                <ImportPageDialogMessage
                    onUploadFile={onUploadFile}
                    onPasteFileLink={onPasteFileLink}
                />,
                {
                    title: importPageDialogTitle,
                    actions: {
                        cancel: { label: t`Cancel` }
                    }
                }
            );
        }
    };
};

export default useImportPageDialog;
