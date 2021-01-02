import React from "react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as DownButton } from "./icons/round-arrow_drop_down-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { useQuery } from "react-apollo";
import { GET_FORM_REVISIONS } from "../../../graphql";
import { useFormEditor } from "@webiny/app-form-builder/admin/components/FormEditor";
const t = i18n.namespace("FormEditor.RevisionsMenu");

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

const Revisions = () => {
    const {
        state: { data }
    } = useFormEditor();

    const { history } = useRouter();

    const getRevisions = useQuery(GET_FORM_REVISIONS, {
        variables: {
            id: data.id.split("#")[0]
        }
    });

    const revisions = getRevisions.loading ? [] : getRevisions.data.formBuilder.revisions.data;

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                history.push(`/forms/${encodeURIComponent(revisions[evt.detail.index].id)}`);
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    {t`Revisions`} <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {revisions.map(rev => (
                <MenuItem key={rev.id} disabled={rev.status !== "draft"}>
                    <Typography use={"body2"}>v{rev.version}</Typography>
                    <Typography use={"caption"}>({rev.status})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default React.memo(Revisions);
