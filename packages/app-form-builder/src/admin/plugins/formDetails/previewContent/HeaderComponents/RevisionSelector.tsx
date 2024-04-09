import React from "react";
import { css } from "emotion";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DownButton } from "../../../../icons/round-arrow_drop_down-24px.svg";

import { MenuItem } from "@webiny/ui/Menu";
import { Typography } from "@webiny/ui/Typography";
import { Menu } from "@webiny/ui/Menu";
import { FbRevisionModel } from "~/types";

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

interface RevisionSelectorProps {
    revisions: FbRevisionModel[];
    revision: FbRevisionModel;
    selectRevision: (form: FbRevisionModel) => void;
}
const RevisionSelector = ({ revisions, revision, selectRevision }: RevisionSelectorProps) => {
    return (
        <Menu
            data-testid={"fb.form-preview.header.revision-selector"}
            className={menuList}
            onSelect={evt => selectRevision(revisions[evt.detail.index])}
            handle={
                <ButtonDefault className={buttonStyle}>
                    v{revision.version} <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {(revisions || []).map(rev => (
                <MenuItem
                    key={rev.id}
                    data-testid={`fb.form-preview.header.revision-v${rev.version}`}
                >
                    <Typography use={"body2"}>v{rev.version}</Typography>
                    <Typography use={"caption"}>({rev.status})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default RevisionSelector;
