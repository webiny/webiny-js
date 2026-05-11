import React from "react";
import { Date } from "@webiny/ui/DateTime/index.js";
import { DropdownMenu, Icon, IconButton, List, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/icons/gesture.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useRevision } from "./useRevision.js";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";

const t = i18n.ns("app-website-builder/modules/Pages/PageEditor/Revisions");

const getIcon = (revision: PageRevision) => {
    switch (true) {
        case revision.locked && revision.status !== "published":
            return {
                icon: (
                    <Icon
                        label={"Locked revision"}
                        icon={<LockIcon />}
                        data-testid={"page.revision.status.locked"}
                    />
                ),
                text: "This revision is locked (it has already been published)"
            };
        case revision.status === "published":
            return {
                icon: (
                    <Icon
                        label="Published revision"
                        icon={<BeenHereIcon />}
                        color={"accent"}
                        data-testid={"page.revision.status.published"}
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
                        data-testid={"page.revision.status.draft"}
                    />
                ),
                text: "This is a draft"
            };
    }
};

interface RevisionListItemProps {
    revision: PageRevision;
}

const RevisionListItem = ({ revision }: RevisionListItemProps) => {
    const { createRevision, editRevision, deleteRevision, unpublishRevision, publishRevision } =
        useRevision({
            revision
        });

    const { icon, text: tooltipText } = getIcon(revision);

    return (
        <List.Item
            icon={<Tooltip content={tooltipText} trigger={icon} />}
            title={revision.title || t`N/A`}
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
                            author: revision.createdBy?.displayName,
                            time: <Date date={revision.savedOn} />,
                            version: revision.version
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
                    data-testid={"page.revisions.more-options"}
                >
                    <>
                        <HasPermission entity={"page"} action={"edit"}>
                            <DropdownMenu.Item
                                onClick={() => createRevision()}
                                data-testid={"page.revisioncreate-revision"}
                                icon={<AddIcon />}
                                text={t`New revision from current`}
                            />
                            {!revision.locked ? (
                                <DropdownMenu.Item
                                    onClick={() => {
                                        editRevision();
                                    }}
                                    icon={<EditIcon />}
                                    text={t`Edit revision`}
                                />
                            ) : null}
                        </HasPermission>

                        <HasPermission entity={"page"} action={"publish"}>
                            {revision.status !== "published" ? (
                                <DropdownMenu.Item
                                    onClick={() => publishRevision()}
                                    icon={<PublishIcon />}
                                    text={t`Publish revision`}
                                />
                            ) : null}
                        </HasPermission>

                        <HasPermission entity={"page"} action={"unpublish"}>
                            {revision.status === "published" ? (
                                <DropdownMenu.Item
                                    onClick={() => unpublishRevision()}
                                    data-testid={"page.revisionunpublish"}
                                    icon={<UnpublishIcon />}
                                    text={t`Unpublish revision`}
                                />
                            ) : null}
                        </HasPermission>

                        <HasPermission entity={"page"} action={"delete"}>
                            {!revision.locked ? (
                                <>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item
                                        onClick={() => deleteRevision()}
                                        icon={<DeleteIcon />}
                                        text={t`Delete revision`}
                                        className={
                                            "text-destructive-primary! [&_svg]:fill-destructive"
                                        }
                                    />
                                </>
                            ) : null}
                        </HasPermission>
                    </>
                </DropdownMenu>
            }
        />
    );
};

export default RevisionListItem;
