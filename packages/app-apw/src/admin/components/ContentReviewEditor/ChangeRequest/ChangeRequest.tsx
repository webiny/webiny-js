import styled from "@emotion/styled";
import React from "react";
import { ButtonDefault, ButtonIcon, IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { ReactComponent as OpenInFullIcon } from "~/admin/assets/icons/open_in_full_24dp.svg";
import { ReactComponent as EditIcon } from "~/admin/assets/icons/edit_24dp.svg";
import { ReactComponent as DeleteIcon } from "~/admin/assets/icons/delete_24dp.svg";
import { ReactComponent as MarkTaskIcon } from "~/admin/assets/icons/task_alt_24dp.svg";
import { useChangeRequest } from "~/admin/hooks/useChangeRequest";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { DefaultRenderImagePreview } from "./ApwFile";
import { useChangeRequestDialog } from "./useChangeRequestDialog";
import { TypographyBody, TypographyTitle } from "../Styled";

const t = i18n.ns("app-apw/content-reviews/editor/steps/changeRequest");

const OpenInFullButton = styled(IconButton)`
    position: absolute;
    top: -12px;
    right: -12px;
    opacity: 0;
    z-index: 1;
`;

const Media = styled.div`
    width: 150px;
    height: 104px;
    border-radius: 4px;
    margin: 0 auto;
    position: relative;

    &:hover::after {
        opacity: 1;
        z-index: 0;
    }

    &:hover button {
        opacity: 1;
    }

    &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
        z-index: -1;
        width: 100%;
        height: 100%;
        transform: scale(1.25);
        background-color: rgba(0, 0, 0, 0.45);
        transition: all 150ms ease-in-out;
        border-radius: 4px;
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
    const { deleteChangeRequest, changeRequest, markResolved } = useChangeRequest({ id });
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

    if (!changeRequest) {
        return null;
    }

    return (
        <ChangeRequestWrapper space={0}>
            <ContentStack space={0}>
                <Stack space={3} padding={6}>
                    <Box>
                        <TypographyTitle use={"subtitle1"}>{changeRequest.title}</TypographyTitle>
                    </Box>
                    <Box>
                        <TypographyBody use={"caption"}>
                            <RichTextEditor readOnly={true} value={changeRequest.body} />
                        </TypographyBody>
                    </Box>
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
                            onClick={async () => {
                                await markResolved(!changeRequest.resolved);
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
                    <Media>
                        <DefaultRenderImagePreview src={changeRequest.media.src} />

                        <OpenInFullButton
                            icon={
                                <Tooltip content={t`Open image in new tab`}>
                                    <OpenInFullIcon />
                                </Tooltip>
                            }
                            onClick={() =>
                                window.open(changeRequest.media.src, "_blank", "noopener")
                            }
                        />
                    </Media>
                ) : (
                    <BlankMedia />
                )}
            </MediaBox>
        </ChangeRequestWrapper>
    );
};

export default ChangeRequest;
