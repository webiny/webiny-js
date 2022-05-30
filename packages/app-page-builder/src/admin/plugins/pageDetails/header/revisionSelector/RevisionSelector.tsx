import React from "react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DownButton } from "../../../../assets/round-arrow_drop_down-24px.svg";
import { MenuItem } from "@webiny/ui/Menu";
import { Typography } from "@webiny/ui/Typography";
import { Menu } from "@webiny/ui/Menu";
import statusesLabels from "../../../../constants/pageStatusesLabels";
import { PbPageData } from "~/types";

const buttonStyle = css({
    "&.mdc-button": {
        color: "var(--mdc-theme-text-primary-on-background) !important"
    }
});

const menuList = css({
    ".mdc-list-item": {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "baseline",
        textAlign: "left",
        width: 150
    }
});

interface RevisionSelectorProps {
    page: PbPageData;
}
const RevisionSelector: React.FC<RevisionSelectorProps> = props => {
    const { page } = props;
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
                    v{page.version} <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {revisions.map(rev => (
                <MenuItem key={rev.id}>
                    <Typography use={"body2"}>v{rev.version}</Typography>
                    <Typography use={"caption"}>({statusesLabels[rev.status]})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default RevisionSelector;
