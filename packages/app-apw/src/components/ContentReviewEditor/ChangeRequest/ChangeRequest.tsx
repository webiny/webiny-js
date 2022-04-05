import styled from "@emotion/styled";
import React from "react";
import { cx, css } from "emotion";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";
import { Box, Columns, Stack } from "~/components/Layout";
import { ReactComponent as EditIcon } from "~/assets/icons/edit_24dp.svg";
import { ReactComponent as DeleteIcon } from "~/assets/icons/delete_24dp.svg";
import { ReactComponent as MarkTaskIcon } from "~/assets/icons/task_alt_24dp.svg";
import { useChangeRequest } from "~/hooks/useChangeRequest";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { DefaultRenderImagePreview } from "./ApwFile";
import { useChangeRequestDialog } from "./useChangeRequestDialog";
import { richTextWrapperStyles, TypographyBody, TypographyTitle } from "../Styled";
import { FileWithOverlay, Media } from "./ChangeRequestMedia";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-apw/content-reviews/editor/steps/changeRequest");

const textStyles = css`
    & .ce-paragraph {
        line-height: 1.1em;
        padding: 0;
    }
`;

const BlankMedia = styled(Media)`
    background: linear-gradient(135deg, rebeccapurple 0%, mediumpurple 100%);
`;

const ChangeRequestWrapper = styled(Columns)`
    border-bottom: 2px solid var(--mdc-theme-primary);
`;

const ActionColumns = styled(Columns)`
    border-top: 1px solid var(--mdc-theme-background);
`;

const ContentStack = styled(Stack)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid var(--mdc-theme-background);
    flex: 1 0 64%;
`;

const RichTextBox = styled(Box)`
    height: 54px;
    overflow: auto;
`;

const MediaBox = styled(Box)`
    flex: 1 0 36%;
`;

const ButtonBox = styled(Box)<{ border?: boolean }>`
    width: 100%;
    display: flex;
    justify-content: center;
    border-left: ${props => (props.border ? "1px solid var(--mdc-theme-background)" : "none")};
    border-right: ${props => (props.border ? "1px solid var(--mdc-theme-background)" : "none")};
`;

const DefaultButton = styled(ButtonDefault)`
    &.mdc-button:not(:disabled) {
        color: var(--mdc-theme-text-secondary-on-background);
    }

    &.mdc-button {
        text-transform: none;
    }
`;

interface ChangeRequestProps {
    id: string;
}

export const ChangeRequest: React.FC<ChangeRequestProps> = props => {
    const { id } = props;
    const { deleteChangeRequest, changeRequest, markResolved, loading } = useChangeRequest({ id });
    const { setOpen, setChangeRequestId } = useChangeRequestDialog();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete change request`,
        message: (
            <p>
                {t`You are about to delete the entire change request and all of its comments!`}
                <br />
                {t`Are you sure you want to permanently delete the change request {title}?`({
                    title: <strong>{changeRequest && changeRequest.title}</strong>
                })}
            </p>
        ),
        dataTestId: "apw-content-review-editor-change-request-delete-dialog"
    });

    const handleResolve = async (resolved: boolean) => {
        await markResolved(!resolved);
    };

    if (!changeRequest) {
        return null;
    }
    /**
     * "RichTextEditor" does not update the rendered text when its value prop changes.
     *  To overcome this issue, we're forcing a re-render via "key" prop.
     */
    const richTextEditorKey = `${id}__${changeRequest?.savedOn}`;

    if (loading) {
        return <CircularProgress label={`Loading`} />;
    }

    return (
        <ChangeRequestWrapper space={0}>
            <ContentStack space={0}>
                <Stack space={3} padding={6}>
                    <Box>
                        <TypographyTitle use={"subtitle1"}>{changeRequest.title}</TypographyTitle>
                    </Box>
                    <RichTextBox>
                        <TypographyBody use={"body2"}>
                            <RichTextEditor
                                key={richTextEditorKey}
                                className={cx(richTextWrapperStyles, textStyles)}
                                readOnly={true}
                                value={changeRequest.body}
                            />
                        </TypographyBody>
                    </RichTextBox>
                </Stack>
                <ActionColumns space={0}>
                    <ButtonBox paddingY={1}>
                        <DefaultButton
                            onClick={() => {
                                setOpen(true);
                                setChangeRequestId(id);
                            }}
                        >
                            <ButtonIcon icon={<EditIcon />} />
                            Edit
                        </DefaultButton>
                    </ButtonBox>
                    <ButtonBox paddingY={1} border={true}>
                        <DefaultButton
                            onClick={() =>
                                showConfirmation(async () => {
                                    await deleteChangeRequest(id);
                                })
                            }
                        >
                            <ButtonIcon icon={<DeleteIcon />} />
                            Delete
                        </DefaultButton>
                    </ButtonBox>
                    <ButtonBox paddingY={1}>
                        <DefaultButton
                            onClick={() => {
                                handleResolve(changeRequest.resolved);
                            }}
                        >
                            <ButtonIcon icon={<MarkTaskIcon />} />
                            {t`{label}`({
                                label: changeRequest.resolved ? "Mark unresolved" : "Mark resolved"
                            })}
                        </DefaultButton>
                    </ButtonBox>
                </ActionColumns>
            </ContentStack>
            <MediaBox paddingX={10} paddingY={9}>
                {changeRequest.media ? (
                    <FileWithOverlay fullWidth={false} media={changeRequest.media}>
                        <DefaultRenderImagePreview src={changeRequest.media.src} />
                    </FileWithOverlay>
                ) : (
                    <BlankMedia />
                )}
            </MediaBox>
        </ChangeRequestWrapper>
    );
};

export default ChangeRequest;
