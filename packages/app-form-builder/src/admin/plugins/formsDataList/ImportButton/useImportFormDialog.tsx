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
import { WrapperWithFileUpload } from "./index";
// assets
import { ReactComponent as UploadFileIcon } from "@material-design-icons/svg/round/upload.svg";
import { ReactComponent as LinkIcon } from "@material-design-icons/svg/round/link.svg";

const t = i18n.ns("app-form-builder/admin/plugins/editor/defaultBar/importForm");

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

export const importFormDialogTitle = t`Import form`;

interface ImportFormDialogContentProps {
    onFileLink: (url: string) => void;
}

interface SetDialogStylesProps {
    [key: string]: string | number;
}

export const ImportFormDialogContent = ({ onFileLink }: ImportFormDialogContentProps) => {
    const ui = useUi();
    const [showLink, setShowLink] = useState<boolean>(false);

    const setDialogStyles = useCallback(
        (style: SetDialogStylesProps) => {
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
                {t`You can import form(s) by either uploading a Webiny Form Export ZIP or by pasting export file URL.`}
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
                                        description={t`The URL has to be public. We'll use it to download the export form data file.`}
                                        label={"File URL"}
                                        data-testid={"import-forms.input-dialog.input-url"}
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

const useImportFormDialog = () => {
    const { showDialog } = useDialog();

    return {
        showImportFormDialog: (onFileLink?: (url: string) => void) => {
            showDialog(
                <ImportFormDialogContent
                    onFileLink={url => {
                        if (!onFileLink) {
                            return;
                        }
                        onFileLink(url);
                    }}
                />,
                {
                    title: importFormDialogTitle,
                    actions: {
                        cancel: { label: t`Cancel` }
                    },
                    dataTestId: "import-forms.input-dialog"
                }
            );
        }
    };
};

export default useImportFormDialog;
