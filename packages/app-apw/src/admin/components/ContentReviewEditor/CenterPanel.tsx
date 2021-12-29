import React from "react";
import { List } from "@webiny/ui/List";
import { PanelBox } from "./Styled";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Box } from "../Layout";
import { i18n } from "@webiny/app/i18n";
import styled from "@emotion/styled";

import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import ChangeRequestListItem from "./ChangeRequest/ChangeRequestListItem";
import ProvideSignOff from "./ChangeRequest/ProvideSignOff";
import { useChangeRequestDialog } from "./ChangeRequest/useChangeRequestDialog";

const t = i18n.ns("app-apw/admin/content-reviews/editor");

const MOCK_CHANGE_REQUESTS = [
    {
        id: 1,
        createdBy: {
            displayName: "Adrian Smijulj"
        },
        createdOn: "5 min ago",
        title: "Change title",
        body: `Overall the structure of the document is good. We just need to tackle a couple of consistency.
                         Also, why is this not title case here, am I missing something?`,
        status: "active"
    },
    {
        id: 2,
        createdBy: {
            displayName: "Adrian Smijulj"
        },
        createdOn: "5 min ago",
        title: "Change title",
        body: `Overall the structure of the document is good. We just need to tackle a couple of consistency.
                         Also, why is this not title case here, am I missing something?`,
        status: "new"
    },
    {
        id: 3,
        createdBy: {
            displayName: "Adrian Smijulj"
        },
        createdOn: "5 min ago",
        title: "Change title",
        body: `Overall the structure of the document is good. We just need to tackle a couple of consistency.
                         Also, why is this not title case here, am I missing something?`,
        status: "inactive"
    }
];

const ChangeRequestList = styled(List)`
    overflow: auto;
    height: calc(100vh - (64px) - (77px) - (56px));
    padding: 0;
`;

const CreateChangeRequestBox = styled(Box)`
    width: 100%;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--mdc-theme-background);
`;

const CenterPanel = () => {
    const { setOpen } = useChangeRequestDialog();
    return (
        <PanelBox flex={"1 1 22%"}>
            <CreateChangeRequestBox paddingX={5} paddingY={5}>
                <ButtonSecondary onClick={() => setOpen(true)}>
                    <ButtonIcon icon={<AddIcon />} />
                    {t`Request Change`}
                </ButtonSecondary>
            </CreateChangeRequestBox>
            <ChangeRequestList>
                {[...MOCK_CHANGE_REQUESTS, ...MOCK_CHANGE_REQUESTS].map(item => (
                    <ChangeRequestListItem key={item.id} {...item} />
                ))}
            </ChangeRequestList>
            <ProvideSignOff />
        </PanelBox>
    );
};

export default CenterPanel;
