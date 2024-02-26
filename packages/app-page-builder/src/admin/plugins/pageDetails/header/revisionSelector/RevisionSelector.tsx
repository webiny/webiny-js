import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { useRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { Typography } from "@webiny/ui/Typography";
import { Menu } from "@webiny/ui/Menu";
import { statuses as statusesLabels } from "~/admin/constants";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { ReactComponent as DownButton } from "~/admin/assets/round-arrow_drop_down-24px.svg";

const buttonStyle = css`
    padding-left: 12px !important;
    padding-right: 12px !important;

    &.mdc-button {
        width: 180px;
        color: var(--mdc-theme-text-primary-on-background) !important;
        border: 1px solid var(--mdc-theme-on-background);
        text-transform: none;

        .mdc-button__label {
            width: 100%;
            justify-content: flex-start;
        }
    }
`;

const statusLabel = css`
    margin-left: 6px;
`;

const arrowStyles = css`
    flex-shrink: 0;
    margin-left: auto !important;
    width: auto !important;
`;

const menuList = css`
    box-shadow: none !important;
    border: 1px solid var(--mdc-theme-on-background);

    .mdc-list-item {
        align-items: center;
        text-align: left;
        width: 154px;
        padding-left: 12px;
        padding-right: 12px;
    }
`;

const MenuItemContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const StatusIndicator = styled.div<{ status: string }>`
    width: 14px;
    height: 14px;
    margin-right: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: ${props =>
        (props.status === "published" && "var(--mdc-theme-secondary)") ||
        (props.status === "draft" && "#fac428") ||
        "var(--mdc-theme-text-icon-on-background)"};
`;

const RevisionSelector = () => {
    const { page } = usePage();
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    const { revisions = [] } = page;

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                query.set("id", page.revisions[evt.detail.index].id);
                history.push({ search: query.toString() });
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    <StatusIndicator status={page.status} />V{page.version}
                    <Typography use={"caption"} className={statusLabel}>
                        ({statusesLabels[page.status]})
                    </Typography>
                    <Icon icon={<DownButton />} className={arrowStyles} />
                </ButtonDefault>
            }
            anchor="bottomLeft"
        >
            {revisions.map(rev => (
                <MenuItem key={rev.id}>
                    <StatusIndicator status={rev.status} />
                    <MenuItemContent>
                        <Typography use={"body2"}>V{rev.version}</Typography>
                        <Typography use={"caption"}>({statusesLabels[rev.status]})</Typography>
                    </MenuItemContent>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default RevisionSelector;
