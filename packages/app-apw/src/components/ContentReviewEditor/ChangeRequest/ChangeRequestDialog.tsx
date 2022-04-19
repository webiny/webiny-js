import React, { useMemo } from "react";
import pick from "lodash/pick";
import { css } from "emotion";
import * as UiDialog from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import { Box, Columns, Stack } from "~/components/Layout";
import styled from "@emotion/styled";
import { useChangeRequestDialog } from "./useChangeRequestDialog";
import { Form } from "@webiny/form";
import { BindComponent } from "@webiny/form";
import { useContentReviewId, useCurrentStepId } from "~/hooks/useContentReviewId";
import { useChangeRequest } from "~/hooks/useChangeRequest";
import { validation } from "@webiny/validation";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { FileManager } from "@webiny/app-admin/components";
import { ApwFile } from "./ApwFile";
import { getNanoid } from "~/utils";

const t = i18n.ns("app-apw/content-review/editor/change-request");

export const richTextMock = [
    {
        tag: "h1",
        content: "Testing H1 tags"
    },
    {
        tag: "p",
        content: "Some small piece of text to test P tags"
    },
    {
        tag: "div",
        content: [
            {
                tag: "p",
                text: "Text inside the div > p"
            },
            {
                tag: "a",
                href: "https://www.webiny.com",
                text: "Webiny"
            }
        ]
    }
];

const ChangeRequestColumns = styled(Columns)`
    width: 700px;
`;

const LeftBox = styled(Box)`
    flex: 1 1 58%;
    border-right: 1px solid var(--mdc-theme-on-background);
`;

const RightBox = styled(Box)`
    flex: 1 1 42%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

interface ChangeRequestMessageProps {
    Bind: BindComponent;
}

const ChangeRequestMessage: React.FC<ChangeRequestMessageProps> = ({ Bind }) => {
    return (
        <ChangeRequestColumns space={1}>
            <LeftBox padding={6}>
                <Stack space={6}>
                    <Box>
                        <Bind name={"title"} validators={validation.create("required")}>
                            <Input
                                type={"text"}
                                label={"Title"}
                                placeholder={"Change request title"}
                            />
                        </Bind>
                    </Box>
                    <Box>
                        <Bind name={"body"} validators={validation.create("required,minLength:1")}>
                            <RichTextEditor
                                minHeight={160}
                                label={"Body"}
                                placeholder={"Message..."}
                            />
                        </Bind>
                    </Box>
                </Stack>
            </LeftBox>
            <RightBox>
                <Bind name={"media"}>
                    {props => (
                        <FileManager
                            onUploadCompletion={([file]) => props.onChange(file)}
                            onChange={props.onChange}
                            images={true}
                            scope={"scope:apw"}
                            own={true}
                        >
                            {({ showFileManager }) => (
                                <ApwFile {...props} showFileManager={showFileManager} />
                            )}
                        </FileManager>
                    )}
                </Bind>
            </RightBox>
        </ChangeRequestColumns>
    );
};

const DialogActions = styled(UiDialog.DialogActions)`
    justify-content: space-between;
`;

const DialogContent = styled(UiDialog.DialogContent)`
    padding: 0 !important;
`;

const dialogContainerStyles = css`
    /*
* By default, a Dialog component has the "z-index" value of 20.
* As we are rendering the content entry form in a "Dialog", the File Manager view triggered by a "file" field
* will render below the source form, rendering it useless for the user.
*
* To fix that issue, we're setting the "z-index" CSS property for this particular Dialog to less than 18,
* which is the "z-index" value assigned to File Manager view, so that it will render below the File Manager view as expected.
*/

    &.mdc-dialog {
        z-index: 17;
    }
`;

const fields = ["title", "body", "media"];

const isValidId = (id: string | null) => {
    if (typeof id !== "string") {
        return false;
    }
    return id.split("#").length === 2;
};

export const ChangeRequestDialog: React.FC = () => {
    const { open, setOpen, changeRequestId, setChangeRequestId } = useChangeRequestDialog();
    const { id: stepId } = useCurrentStepId();
    const useContentReviewIdResult = useContentReviewId();
    if (!useContentReviewIdResult) {
        return null;
    }
    const { id: contentReviewId } = useContentReviewIdResult;

    const id = isValidId(changeRequestId) ? changeRequestId : null;
    const { create, changeRequest, update, loading } = useChangeRequest({ id });

    const resetFormAndCloseDialog = () => {
        setChangeRequestId(getNanoid());
        closeDialog();
    };

    const closeDialog = () => setOpen(false);

    const formData = useMemo(() => {
        if (open) {
            return pick(changeRequest, fields);
        }
        return null;
    }, [open, changeRequest]);

    const onSubmit = async (formData: any) => {
        const data = {
            ...formData,
            step: `${contentReviewId}#${stepId}`
        };
        /**
         * If "changeRequestId" exists it means we're editing the change request.
         */
        if (isValidId(changeRequestId)) {
            await update({
                variables: { id: changeRequestId, data: pick(data, fields) }
            });
        } else {
            await create({ variables: { data } });
        }
        resetFormAndCloseDialog();
    };

    return (
        <Form data={formData as FormData} onSubmit={onSubmit}>
            {props => (
                <UiDialog.Dialog
                    open={open}
                    onClose={closeDialog}
                    data-testid="apw-new-change-request-modal"
                    className={dialogContainerStyles}
                    preventOutsideDismiss={true} // We want users to explicitly close the dialog with "Cancel" button
                >
                    <UiDialog.DialogTitle>{t`Change request`}</UiDialog.DialogTitle>
                    <DialogContent>
                        {loading && <CircularProgress label={t`Loading`} />}
                        <ChangeRequestMessage Bind={props.Bind} key={changeRequestId} />
                    </DialogContent>
                    <DialogActions>
                        <ButtonDefault onClick={resetFormAndCloseDialog}>{t`Cancel`}</ButtonDefault>
                        <ButtonPrimary
                            onClick={() => {
                                props.submit();
                            }}
                        >{t`Submit`}</ButtonPrimary>
                    </DialogActions>
                </UiDialog.Dialog>
            )}
        </Form>
    );
};
