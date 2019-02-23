//@flow
import React from "react";
import { css } from "emotion";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { ButtonDefault } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as DownButton } from "webiny-app-cms/admin/assets/round-arrow_drop_down-24px.svg";
import { MenuItem } from "@rmwc/menu";
import { Typography } from "webiny-ui/Typography";
import { Menu } from "webiny-ui/Menu";
import { get } from "lodash";
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

type Props = WithPageDetailsProps & WithRouterProps;

const RevisionSelector = ({ router, pageDetails: { page } }: Props) => {
    return (
        <Menu
            className={menuList}
            onSelect={evt =>
                router.goToRoute({
                    params: { id: page.revisions[evt.detail.index].id },
                    merge: true
                })
            }
            handle={
                <ButtonDefault className={buttonStyle}>
                    v{page.version} <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {(get("page.revisions") || []).map(rev => {
                let status = "draft";
                if (rev.published) status = "published";
                if (rev.locked && !rev.published) status = "locked";

                return (
                    <MenuItem key={rev.id}>
                        <Typography use={"body2"}>v{rev.version}</Typography>
                        <Typography use={"caption"}>({status})</Typography>
                    </MenuItem>
                );
            })}
        </Menu>
    );
};

export default withRouter()(RevisionSelector);
