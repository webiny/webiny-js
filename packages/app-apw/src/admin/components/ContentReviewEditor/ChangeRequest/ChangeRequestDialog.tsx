import React from "react";
import { useRouter } from "@webiny/react-router";
import * as UiDialog from "@webiny/ui/Dialog";
import { ButtonDefault } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { Input } from "@webiny/ui/Input";
import { ReactComponent as MediaIcon } from "~/admin/assets/icons/media-input_figma.svg";
import styled from "@emotion/styled";
import { useChangeRequestDialog } from "./useChangeRequestDialog";

const t = i18n.ns("app-apw/content-review/editor/change-request");

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

const ChangeRequestMessage = () => {
    return (
        <ChangeRequestColumns space={1}>
            <LeftBox padding={6}>
                <Stack space={6}>
                    <Box>
                        <Input type={"text"} placeholder={"Change request title"} />
                    </Box>
                    <Box>
                        <Input rows={6} type={"text"} placeholder={"Message"} />
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

const NewChangeRequestDialog: React.FC = () => {
    const { history } = useRouter();
    const { open, setOpen } = useChangeRequestDialog();

    const closeDialog = () => setOpen(false);

    return (
        <UiDialog.Dialog
            open={open}
            onClose={closeDialog}
            data-testid="apw-new-change-request-modal"
        >
            <UiDialog.DialogTitle>{t`Change request`}</UiDialog.DialogTitle>
            <DialogContent>
                <ChangeRequestMessage />
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={closeDialog}>{t`Cancel`}</ButtonDefault>
                <ButtonDefault onClick={() => history.push("/page-builder/categories")}>
                    {t`Submit`}
                </ButtonDefault>
            </DialogActions>
        </UiDialog.Dialog>
    );
};

export default NewChangeRequestDialog;
