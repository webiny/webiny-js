import React from "react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as DownButton } from "./icons/round-arrow_drop_down-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { useQuery } from "@apollo/react-hooks";
import {
    GET_FORM_REVISIONS,
    GetFormRevisionsQueryResponse,
    GetFormRevisionsQueryVariables
} from "~/admin/graphql";
import { useFormEditor } from "~/admin/components/FormEditor";
const t = i18n.namespace("FormEditor.RevisionsMenu");

const buttonStyle = css({
    "&.mdc-button": {
        color: "var(--mdc-theme-text-primary-on-background) !important"
    }
});

const menuList = css({
    ".mdc-deprecated-list-item": {
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

    const getRevisions = useQuery<GetFormRevisionsQueryResponse, GetFormRevisionsQueryVariables>(
        GET_FORM_REVISIONS,
        {
            variables: {
                id: data.id.split("#")[0]
            }
        }
    );

    const revisions =
        getRevisions.loading || !getRevisions.data
            ? []
            : getRevisions.data.formBuilder.revisions.data;

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                history.push(
                    `/form-builder/forms/${encodeURIComponent(revisions[evt.detail.index].id)}`
                );
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
