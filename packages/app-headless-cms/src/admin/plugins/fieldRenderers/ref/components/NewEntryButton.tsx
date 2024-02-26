import React from "react";
import styled from "@emotion/styled";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

const DefaultButton = styled(ButtonDefault)`
    margin-left: 32px;
`;

export const NewEntryButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <DefaultButton small={true} onClick={onClick}>
            <ButtonIcon icon={<AddIcon />} />
            New Entry
        </DefaultButton>
    );
};
