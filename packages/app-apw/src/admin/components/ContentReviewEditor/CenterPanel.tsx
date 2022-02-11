import React from "react";
import { Switch, Route, useRouteMatch } from "@webiny/react-router";
import styled from "@emotion/styled";
import { List } from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

import { useChangeRequestsList } from "~/admin/hooks/useChangeRequestsList";
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
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--mdc-theme-background);
`;

export const CenterPanel = () => {
    const { setOpen } = useChangeRequestDialog();
    const { changeRequests, loading } = useChangeRequestsList({ sorters: [] });
    const { path } = useRouteMatch();

    if (loading) {
        return <Typography use={"caption"}>Loading Change requests...</Typography>;
    }
    return (
        <>
            <PanelBox flex={"1 1 22%"}>
                <CreateChangeRequestBox paddingX={5} paddingY={5}>
                    <ButtonSecondary onClick={() => setOpen(true)}>
                        <ButtonIcon icon={<AddIcon />} />
                        {t`Request Change`}
                    </ButtonSecondary>
                </CreateChangeRequestBox>
                <ChangeRequestList>
                    {changeRequests.map(item => (
                        <ChangeRequestListItem key={item.id} {...item} />
                    ))}
                </ChangeRequestList>
                <ProvideSignOff />
            </PanelBox>
            <Switch>
                <Route exact path={path}>
                    <PanelBox flex={"1 1 52%"}>
                        <PlaceholderBox />
                    </PanelBox>
                </Route>
                <Route path={`${path}/:changeRequestId`}>
                    <RightPanel />
                </Route>
            </Switch>
        </>
    );
};
