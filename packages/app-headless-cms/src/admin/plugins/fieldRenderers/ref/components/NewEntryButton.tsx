import React from "react";
import styled from "@emotion/styled";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

const DefaultButton = styled(Button)`
    margin-left: 32px;
`;

export const NewEntryButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <DefaultButton variant={"secondary"} size={"sm"} onClick={onClick}>
            <AddIcon />
            New Entry
        </DefaultButton>
    );
};
