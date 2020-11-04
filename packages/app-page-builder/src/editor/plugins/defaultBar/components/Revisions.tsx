import React from "react";
import { revisionsAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { useRecoilValue } from "recoil";
import { ReactComponent as DownButton } from "./icons/round-arrow_drop_down-24px.svg";

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
        textAlign: "left"
    }
});

type RevisionStatusType = "published" | "locked" | "draft";
const getStatus = (rev: any): RevisionStatusType => {
    if (rev.published) {
        return "published";
    } else if (rev.locked && !rev.published) {
        return "locked";
    }
    return "draft";
};

const Revisions: React.FunctionComponent = () => {
    const revisions = useRecoilValue(revisionsAtom);
    const { history } = useRouter();
    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                history.push(`/page-builder/editor/${revisions[evt.detail.index].id}`);
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    Revisions <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {revisions.map(rev => {
                const status = getStatus(rev);
                return (
                    <MenuItem key={rev.id} disabled={status !== "draft"}>
                        <Typography use={"body2"}>v{rev.version}</Typography>
                        <Typography use={"caption"}>({status}) </Typography>
                    </MenuItem>
                );
            })}
        </Menu>
    );
};

export default Revisions;
