import React from "react";
import { css } from "emotion";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as DownButton } from "./round-arrow_drop_down-24px.svg";
import { useRevisions } from "~/pageEditor/hooks/useRevisions";
import { RevisionItemAtomType } from "~/pageEditor/state";
import { createComponentPlugin } from "@webiny/app-admin";
import { EditorBar } from "~/editor";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import cloneDeep from "lodash/cloneDeep";

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

enum RevisionStatusEnum {
    PUBLISHED = "published",
    LOCKED = "locked",
    DRAFT = "draft"
}
const getStatus = (revision: RevisionItemAtomType): RevisionStatusEnum => {
    if (revision.published) {
        return RevisionStatusEnum.PUBLISHED;
    } else if (revision.locked && !revision.published) {
        return RevisionStatusEnum.LOCKED;
    }
    return RevisionStatusEnum.DRAFT;
};

const Revisions: React.FC = () => {
    const [revisions] = useRevisions();
    const { navigateToPageEditor } = useNavigatePage();
    // Here we sort revisions so the latest revision version will appear on the top of the list.
    // Also we use lodash fucntion cloneDeep because revisions are read only, so in order to use Array.prototype.sort method without causing errors.
    // We need to copy revisions and then we can use Array.prototype.sort method.
    const modifiedRevisions = cloneDeep(revisions).sort((a, b) => b.version - a.version);

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                navigateToPageEditor(revisions[evt.detail.index].id);
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    Revisions <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {modifiedRevisions.map(rev => {
                const status = getStatus(rev);
                return (
                    <MenuItem key={rev.id} disabled={status !== RevisionStatusEnum.DRAFT}>
                        <Typography use={"body2"}>v{rev.version}</Typography>
                        <Typography use={"caption"}>({status}) </Typography>
                    </MenuItem>
                );
            })}
        </Menu>
    );
};

const ComposeRevisionSelector = createComponentPlugin(EditorBar.RightSection, RightSection => {
    return function ComposeRightSection(props) {
        return (
            <RightSection>
                <Revisions />
                <EditorBar.Divider />
                {props.children}
            </RightSection>
        );
    };
});

export const RevisionsPlugin = () => {
    return <ComposeRevisionSelector />;
};
