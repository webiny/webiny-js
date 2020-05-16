import React from "react";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import {
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemGraphic,
    ListItemMeta
} from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem, Menu, MenuDivider } from "@webiny/ui/Menu";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-headless-cms/admin/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "@webiny/app-headless-cms/admin/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/app-headless-cms/admin/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/app-headless-cms/admin/icons/gesture.svg";
import { ReactComponent as AddIcon } from "@webiny/app-headless-cms/admin/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/app-headless-cms/admin/icons/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/publish.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/delete.svg";
import useReactRouter from "use-react-router";
import { CmsContentModelModel } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: CmsContentModelModel) => {
    switch (true) {
        case rev.meta.locked && !rev.meta.published:
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case rev.meta.published:
            return {
                icon: <Icon icon={<BeenHereIcon />} className={primaryColor} />,
                text: "This revision is currently published!"
            };
        default:
            return {
                icon: <Icon icon={<GestureIcon />} />,
                text: "This is a draft"
            };
    }
};

const Revision = props => {
    const { revision, createContentFrom, deleteContent, publishContent } = props;
    const { icon, text: tooltipText } = getIcon(revision);

    const { history } = useReactRouter();

    return (
        <ConfirmationDialog
            title={t`Confirmation required!`}
            message={<span>{t`Are you sure you want to delete this revision?`}</span>}
        >
            {({ showConfirmation }) => (
                <ListItem>
                    <ListItemGraphic>
                        <Tooltip content={tooltipText} placement={"bottom"}>
                            {icon}
                        </Tooltip>
                    </ListItemGraphic>
                    <ListItemText>
                        <ListItemTextPrimary>
                            <I18NValue value={revision.meta.title} default={t`N/A`} />
                        </ListItemTextPrimary>
                        <ListItemTextSecondary>
                            {t`Last modified: {time} (#{version})`({
                                time: <TimeAgo datetime={revision.savedOn} />,
                                version: revision.meta.version
                            })}
                        </ListItemTextSecondary>
                    </ListItemText>
                    <ListItemMeta>
                        <Menu
                            handle={<IconButton icon={<MoreVerticalIcon />} />}
                            className={revisionsMenu}
                        >
                            <MenuItem onClick={() => createContentFrom(revision)}>
                                <ListItemGraphic>
                                    <Icon icon={<AddIcon />} />
                                </ListItemGraphic>
                                {t`New from current`}
                            </MenuItem>

                            {!revision.meta.locked && (
                                <MenuItem
                                    onClick={() => {
                                        const { id } = revision;
                                        const query = new URLSearchParams(location.search);
                                        query.set("id", id);
                                        history.push({ search: query.toString() });
                                    }}
                                >
                                    <ListItemGraphic>
                                        <Icon icon={<EditIcon />} />
                                    </ListItemGraphic>
                                    {t` Edit`}
                                </MenuItem>
                            )}

                            {!revision.meta.published && (
                                <MenuItem onClick={() => publishContent(revision)}>
                                    <ListItemGraphic>
                                        <Icon icon={<PublishIcon />} />
                                    </ListItemGraphic>
                                    {t`Publish`}
                                </MenuItem>
                            )}

                            {!revision.meta.locked && revision.id !== revision.meta.parent && (
                                <div>
                                    <MenuDivider />
                                    <MenuItem
                                        onClick={() =>
                                            showConfirmation(() => deleteContent(revision))
                                        }
                                    >
                                        <ListItemGraphic>
                                            <Icon icon={<DeleteIcon />} />
                                        </ListItemGraphic>
                                        {t` Delete`}
                                    </MenuItem>
                                </div>
                            )}
                        </Menu>
                    </ListItemMeta>
                </ListItem>
            )}
        </ConfirmationDialog>
    );
};

export default Revision;
