import React from "react";
import pick from "lodash/pick";
import * as UiDialog from "@webiny/ui/Dialog";
import { ButtonDefault } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { Input } from "@webiny/ui/Input";
import { ReactComponent as MediaIcon } from "~/admin/assets/icons/media-input_figma.svg";
import styled from "@emotion/styled";
import { useChangeRequestDialog } from "./useChangeRequestDialog";
import { Form } from "@webiny/form";
import { BindComponent } from "@webiny/form";
import { useContentReviewId, useCurrentStepId } from "~/admin/hooks/useContentReviewId";
import { useChangeRequest } from "~/admin/hooks/useChangeRequest";
import { validation } from "@webiny/validation";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";

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

const Media = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 187px;
    height: 184px;
    border-radius: 10px;
    border: 1px solid var(--mdc-theme-on-background);
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
                <Media>
                    <MediaIcon />
                </Media>
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

export const ChangeRequestDialog: React.FC = () => {
    const { open, setOpen, changeRequestId } = useChangeRequestDialog();
    const { id: stepId } = useCurrentStepId();
    const { id: contentReviewId } = useContentReviewId();
    const { create, changeRequest, update } = useChangeRequest({ id: changeRequestId });

    const closeDialog = () => setOpen(false);

    return (
        <Form
            data={pick(changeRequest, ["title", "body"])}
            onSubmit={async formData => {
                const data = {
                    ...formData,
                    step: `${contentReviewId}#${stepId}`
                };
                /**
                 * If "changeRequestId" exists it means we're editing the change request.
                 */
                if (changeRequestId) {
                    await update({
                        variables: { id: changeRequestId, data: pick(data, ["title", "body"]) }
                    });
                } else {
                    await create({ variables: { data } });
                }
                closeDialog();
            }}
        >
            {props => (
                <UiDialog.Dialog
                    open={open}
                    onClose={closeDialog}
                    data-testid="apw-new-change-request-modal"
                >
                    <UiDialog.DialogTitle>{t`Change request`}</UiDialog.DialogTitle>
                    <DialogContent>
                        <ChangeRequestMessage Bind={props.Bind} key={changeRequestId} />
                    </DialogContent>
                    <DialogActions>
                        <ButtonDefault onClick={closeDialog}>{t`Cancel`}</ButtonDefault>
                        <ButtonDefault onClick={props.submit}>{t`Submit`}</ButtonDefault>
                    </DialogActions>
                </UiDialog.Dialog>
            )}
        </Form>
    );
};
