import styled from "@emotion/styled";
import React from "react";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { TypographyBody, TypographyTitle } from "../Styled";

import { ReactComponent as EditIcon } from "~/admin/assets/icons/edit_24dp.svg";
import { ReactComponent as DeleteIcon } from "~/admin/assets/icons/delete_24dp.svg";
import { ReactComponent as MarkTaskIcon } from "~/admin/assets/icons/task_alt_24dp.svg";
import { useChangeRequest } from "~/admin/hooks/useChangeRequest";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { useChangeRequestDialog } from "~/admin/components/ContentReviewEditor/ChangeRequest/useChangeRequestDialog";

const t = i18n.ns("app-apw/content-reviews/editor/steps/changeRequest");

const Media = styled.div`
    width: 150px;
    height: 104px;
    background: linear-gradient(135deg, rebeccapurple 0%, mediumpurple 100%);
    border-radius: 4px;
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
`;

interface ChangeRequestProps {
    id: string;
}

export const ChangeRequest: React.FC<ChangeRequestProps> = props => {
    const { id } = props;
    const { deleteChangeRequest, changeRequest } = useChangeRequest({ id });
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
                            {`Overall the structure of the document is good. We just need to tackle a couple of consistency / missing-context thingies, and we should be good to go. `}
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
                        <DefaultButton onClick={() => console.log("Mark resolved ", id)}>
                            <ButtonIcon icon={<MarkTaskIcon />} />
                            Mark resolved
                        </DefaultButton>
                    </ButtonBox>
                </ActionColumns>
            </ContentStack>

            <Box paddingX={10} paddingY={9}>
                <Media />
            </Box>
        </ChangeRequestWrapper>
    );
};

export default ChangeRequest;
