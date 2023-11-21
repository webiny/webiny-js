import React from "react";
import { Routes, Route } from "@webiny/react-router";
import styled from "@emotion/styled";
import { List } from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

import { useChangeRequestsList } from "~/hooks/useChangeRequestsList";
import { useCurrentStep } from "~/hooks/useCurrentStep";
import { ChangeRequestListItem } from "./ChangeRequest/ChangeRequestListItem";
import { ProvideSignOff } from "./ChangeRequest/ProvideSignOff";
import { useChangeRequestDialog } from "./ChangeRequest/useChangeRequestDialog";
import { Box } from "../Layout";
import { PanelBox } from "./Styled";
import { RightPanel } from "./RightPanel";
import { PlaceholderBox } from "./PlaceholderBox";

const t = i18n.ns("app-apw/admin/content-reviews/editor");

const ChangeRequestList = styled(List)`
    overflow: auto;
    height: calc(100vh - (64px) - (77px) - (56px));
    padding: 0;
`;

const CreateChangeRequestBox = styled(Box)`
    width: 100%;
    min-height: 80px;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--mdc-theme-background);
`;

const disableButtonText = t`Please retract the sign-off before opening a new change request.`;

interface CreateChangeRequestProps {
    create: () => void;
    disabled: boolean;
}

const CreateChangeRequest: React.FC<CreateChangeRequestProps> = ({ create, disabled }) => {
    if (disabled) {
        return (
            <CreateChangeRequestBox paddingX={5} paddingY={5}>
                <Tooltip content={disableButtonText}>
                    <ButtonSecondary onClick={create} disabled={true}>
                        <ButtonIcon icon={<AddIcon />} />
                        {t`Request Change`}
                    </ButtonSecondary>
                </Tooltip>
            </CreateChangeRequestBox>
        );
    }

    return (
        <CreateChangeRequestBox paddingX={5} paddingY={5}>
            <ButtonSecondary onClick={create} disabled={disabled}>
                <ButtonIcon icon={<AddIcon />} />
                {t`Request Change`}
            </ButtonSecondary>
        </CreateChangeRequestBox>
    );
};

export const CenterPanel = () => {
    const { setOpen } = useChangeRequestDialog();
    const { changeRequests, loading } = useChangeRequestsList({ sorters: [] });
    const { currentStep, changeRequestsPending } = useCurrentStep();

    if (loading) {
        return <Typography use={"caption"}>Loading Change requests...</Typography>;
    }
    return (
        <>
            <PanelBox flex={"1 1 22%"}>
                <CreateChangeRequest
                    disabled={currentStep !== null && currentStep.signOffProvidedOn !== null}
                    create={() => setOpen(true)}
                />
                <ChangeRequestList>
                    {changeRequests.map(item => (
                        <ChangeRequestListItem key={item.id} {...item} />
                    ))}
                </ChangeRequestList>
                {currentStep && (
                    <ProvideSignOff
                        currentStep={currentStep}
                        changeRequestsPending={changeRequestsPending}
                    />
                )}
            </PanelBox>
            <Routes>
                <Route path={"/"}>
                    <PanelBox flex={"1 1 52%"}>
                        <PlaceholderBox
                            text={`Click on the left side list to display change request details or create one.`}
                        />
                    </PanelBox>
                </Route>
                <Route path={`:changeRequestId`}>
                    <RightPanel />
                </Route>
            </Routes>
        </>
    );
};
