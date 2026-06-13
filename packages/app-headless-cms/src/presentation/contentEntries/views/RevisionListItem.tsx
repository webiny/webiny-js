import React from "react";
import { useFeature } from "@webiny/app";
import { useRoute, useRouter } from "@webiny/app-admin";
import { DropdownMenu, Icon, IconButton, List, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/icons/gesture.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { CmsContentEntryRevision } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

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

export const RevisionListItem = ({ revision }: RevisionListItemProps) => {
    const { vm: formVm } = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);
    const { canEdit, canDelete, canPublish } = usePermission();
    const { icon, text: tooltipText } = getIcon(revision);

    const navigateToRevision = (id: string) => {
        goToRoute(Routes.ContentEntries.List, { ...route.params, id });
    };

    const handleCreateRevision = async () => {
        const entry = await revisionsPresenter.createRevision(revision.id);
        if (entry) {
            navigateToRevision(entry.id);
            revisionsPresenter.hide();
        }
    };

    const handleEditRevision = () => {
        navigateToRevision(revision.id);
        revisionsPresenter.hide();
    };

    const handleDeleteRevision = async () => {
        const deleted = await revisionsPresenter.deleteRevision(revision.id);
        if (deleted) {
            const revisions = revisionsPresenter.vm.revisions;
            const remaining = revisions.filter(r => r.id !== revision.id);
            const latest = remaining[0];
            if (latest) {
                navigateToRevision(latest.id);
            }
            revisionsPresenter.hide();
        }
    };

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
                            author: revision.revisionCreatedBy?.displayName,
                            time: <DateDisplay date={revision.revisionSavedOn} />,
                            version: revision.meta.version
                        })}
                    </Text>
                </>
            }
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
                        {formVm.entry && canEdit(formVm.entry, "cms.contentEntry") && (
                            <DropdownMenu.Item
                                onClick={handleCreateRevision}
                                data-testid={"cms.revision.create-revision"}
                                icon={<AddIcon />}
                                text={t`New revision from current`}
                            />
                        )}

                        {!revision.meta.locked &&
                            formVm.entry &&
                            canEdit(formVm.entry, "cms.contentEntry") && (
                                <DropdownMenu.Item
                                    onClick={handleEditRevision}
                                    icon={<EditIcon />}
                                    text={t`Edit revision`}
                                />
                            )}

                        {revision.meta.status !== "published" && canPublish("cms.contentEntry") && (
                            <DropdownMenu.Item
                                onClick={handleEditRevision}
                                icon={<PublishIcon />}
                                text={t`Publish revision`}
                            />
                        )}

                        {!revision.meta.locked &&
                            formVm.entry &&
                            canDelete(formVm.entry, "cms.contentEntry") && (
                                <>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item
                                        onClick={handleDeleteRevision}
                                        icon={<DeleteIcon />}
                                        text={t`Delete revision`}
                                        className={
                                            "text-destructive-primary! [&_svg]:fill-destructive"
                                        }
                                    />
                                </>
                            )}
                    </>
                </DropdownMenu>
            }
        />
    );
};
