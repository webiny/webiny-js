import React from "react";
import { css } from "emotion";
import { get } from "lodash";
import { useRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ReactComponent as DownButton } from "../../../../icons/round-arrow_drop_down-24px.svg";
import statusLabels from "../../../../constants/statusLabels";

const buttonStyle = css({
    "&.mdc-button": {
        color: "var(--mdc-theme-text-primary-on-background) !important"
    }
});

const menuStyles = css({
    width: 150,
    right: 0,
    ".mdc-list-item": {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "baseline",
        textAlign: "left"
    }
});

const RevisionSelector = ({ entry, revisions, getLoading }) => {
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    const currentRevision = {
        version: get(entry, "meta.version", 1),
        status: get(entry, "meta.status", "draft")
    };

    const allRevisions = revisions.length
        ? revisions
        : [{ id: "new", meta: { version: 1, status: "draft" } }];

    return (
        <Menu
            className={menuStyles}
            handle={
                <ButtonDefault className={buttonStyle} disabled={getLoading()}>
                    v{currentRevision.version} ({statusLabels[currentRevision.status]}){" "}
                    <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {allRevisions.map(revision => (
                <MenuItem
                    key={revision.id}
                    onClick={() => {
                        query.set("id", encodeURIComponent(revision.id));
                        history.push({ search: query.toString() });
                    }}
                >
                    <Typography use={"body2"}>v{revision.meta.version}</Typography>
                    <Typography use={"caption"}>({statusLabels[revision.meta.status]})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default RevisionSelector;
