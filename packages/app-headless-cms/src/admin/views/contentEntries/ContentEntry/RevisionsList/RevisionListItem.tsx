import React from "react";
const DateDisplay = ({ date }: { date: string }) => {
    const formatted = React.useMemo(() => {
        const d = new globalThis.Date(date);
        if (isNaN(d.getTime())) {
            return "";
        }
        return new Intl.DateTimeFormat(navigator.language, {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(d);
    }, [date]);
    return <>{formatted}</>;
};
import { DropdownMenu, Icon, IconButton, List, Tooltip, Text } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/icons/gesture.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { CmsContentEntryRevision } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { useRevision } from "./useRevision.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry.js";
import { PublishEntryRevisionListItem } from "./PublishEntryRevisionListItem.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const getIcon = (rev: CmsContentEntryRevision) => {
    switch (true) {
        case rev.meta.locked && rev.meta.status !== "published":
            return {
                icon: (
                    <Icon
                        label={"Locked revision"}
                        icon={<LockIcon />}
                        data-testid={"cms.revision.status.locked"}
                    />
                ),
                text: "This revision is locked (it has already been published)"
            };
        case rev.meta.status === "published":
            return {
                icon: (
                    <Icon
                        label="Published revision"
                        icon={<BeenHereIcon />}
                        color={"accent"}
                        data-testid={"cms.revision.status.published"}
                    />
                ),
                text: "This revision is currently published!"
            };
        default:
            return {
                icon: (
                    <Icon
                        label={"Draft revision"}
                        icon={<GestureIcon />}
                        data-testid={"cms.revision.status.draft"}
                    />
                ),
                text: "This is a draft"
            };
    }
};

interface RevisionListItemProps {
    revision: CmsContentEntryRevision;
}

const RevisionListItem = ({ revision }: RevisionListItemProps) => {
    const { createRevision, deleteRevision, unpublishRevision, editRevision, publishRevision } =
        useRevision({
            revision
        });

    const { entry, setActiveTab } = useContentEntry();
    const { canEdit, canDelete, canPublish, canUnpublish } = usePermission();
    const { icon, text: tooltipText } = getIcon(revision);

    return (
        <List.Item
            icon={<Tooltip content={tooltipText} trigger={icon} />}
            title={revision.meta.title || t`N/A`}
            description={
                <>
                    {revision.revisionDescription ? (
                        <Text as={"div"} size={"md"} className={"mb-2"}>
                            {revision.revisionDescription}
                        </Text>
                    ) : null}
                    <Text as={"div"} size={"sm"}>
                        {t`Last modified by {author} on {time} (#{version})`({
                            // Added this because revisionCreatedBy can be returned as null from GraphQL.
                            author: revision.revisionCreatedBy?.displayName,
                            time: <DateDisplay date={revision.revisionSavedOn} />,
                            version: revision.meta.version
                        })}
                    </Text>
                </>
            }
            about={revision.revisionDescription}
            actions={
                <DropdownMenu
                    trigger={
                        <IconButton
                            variant={"ghost"}
                            size={"sm"}
                            iconSize={"lg"}
                            icon={<MoreVerticalIcon />}
                        />
                    }
                    data-testid={"cms.content-form.revisions.more-options"}
                >
                    <>
                        {canEdit(entry, "cms.contentEntry") && (
                            <DropdownMenu.Item
                                onClick={() => createRevision()}
                                data-testid={"cms.revision.create-revision"}
                                icon={<AddIcon />}
                                text={t`New revision from current`}
                            />
                        )}

                        {!revision.meta.locked && canEdit(entry, "cms.contentEntry") && (
                            <DropdownMenu.Item
                                onClick={() => {
                                    editRevision();
                                    setActiveTab("content");
                                }}
                                icon={<EditIcon />}
                                text={t`Edit revision`}
                            />
                        )}

                        {revision.meta.status !== "published" && canPublish("cms.contentEntry") && (
                            <PublishEntryRevisionListItem
                                onClick={() => publishRevision()}
                                icon={<PublishIcon />}
                                text={t`Publish revision`}
                            />
                        )}

                        {revision.meta.status === "published" &&
                            canUnpublish("cms.contentEntry") && (
                                <DropdownMenu.Item
                                    onClick={() => unpublishRevision()}
                                    data-testid={"cms.revision.unpublish"}
                                    icon={<UnpublishIcon />}
                                    text={t`Unpublish revision`}
                                />
                            )}

                        {!revision.meta.locked && canDelete(entry, "cms.contentEntry") && (
                            <>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item
                                    onClick={() => deleteRevision()}
                                    icon={<DeleteIcon />}
                                    text={t` Delete revision`}
                                    className={"text-destructive-primary! [&_svg]:fill-destructive"}
                                />
                            </>
                        )}
                    </>
                </DropdownMenu>
            }
        />
    );
};

export default RevisionListItem;
