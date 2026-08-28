import React from "react";
import { observer } from "mobx-react-lite";
import { Route, useRouter } from "@webiny/app-admin";
import { Avatar, IconButton, TimeAgo } from "@webiny/admin-ui";
import { ReactComponent as MentionIcon } from "@webiny/icons/alternate_email.svg";
import { ReactComponent as ReplyIcon } from "@webiny/icons/reply.svg";
import { ReactComponent as ReviewIcon } from "@webiny/icons/rate_review.svg";
import { ReactComponent as ApprovedIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as RejectedIcon } from "@webiny/icons/cancel.svg";
import { ReactComponent as ArchiveIcon } from "@webiny/icons/archive.svg";
import { ReactComponent as UnarchiveIcon } from "@webiny/icons/unarchive.svg";
import type { NotificationsPresenter } from "../abstractions.js";
import { avatarColor, initials } from "../styles.js";
import type { Notification, NotificationLink, NotificationType } from "~/types.js";

// Mirrors the Headless CMS "content entries" route so we can navigate without depending on
// @webiny/app-headless-cms. `goToRoute` resolves by the route name.
// Deep-link query params consumed by @webiny/app-collaboration to open + highlight the thread
// once the target entry loads. Duplicated (not imported) so notifications carries no dependency
// on collaboration.
const COLLAB_THREAD_PARAM = "commentThread";
const COLLAB_FIELD_PARAM = "commentField";

const CMS_ENTRIES_ROUTE = new Route({
    name: "Cms/ContentEntries/List",
    path: "/cms/content-entries/:modelId",
    params: zod => ({
        modelId: zod.string(),
        id: zod.string().optional(),
        [COLLAB_THREAD_PARAM]: zod.string().optional(),
        [COLLAB_FIELD_PARAM]: zod.string().optional()
    })
});

/**
 * Resolves a Headless CMS entry route from a notification link. Collaboration links encode
 * `contentId` as "<modelId>:<entryId>". Returns null for links we can't navigate to yet
 * (e.g. workflow links that carry only a bare targetId without a model).
 */
const cmsEntryTarget = (link?: NotificationLink | null) => {
    if (!link || link.app !== "cms" || !link.contentId) {
        return null;
    }
    const [modelId, entryId] = link.contentId.split(":");
    if (!modelId || !entryId) {
        return null;
    }
    return { modelId, entryId };
};

interface Props {
    presenter: NotificationsPresenter.Interface;
    notification: Notification;
}

const ACTION_TEXT: Record<NotificationType, string> = {
    mention: "mentioned you on",
    reply: "replied to your comment on",
    reviewRequested: "requested your review on",
    approved: "approved",
    rejected: "rejected"
};

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
    mention: <MentionIcon />,
    reply: <ReplyIcon />,
    reviewRequested: <ReviewIcon />,
    approved: <ApprovedIcon />,
    rejected: <RejectedIcon />
};

const renderSnippet = (body: string) => {
    return body.split(/(@[^\s]+)/g).map((part, index) =>
        part.startsWith("@") ? (
            <span key={index} className="wby-notif-mention">
                {part}
            </span>
        ) : (
            <React.Fragment key={index}>{part}</React.Fragment>
        )
    );
};

export const NotificationItem = observer(({ presenter, notification }: Props) => {
    const router = useRouter();
    const actorName = notification.actor.displayName || "Someone";
    const target = cmsEntryTarget(notification.link);

    const open = () => {
        void presenter.markRead(notification.id);
        presenter.closePanel();
        if (!target) {
            return;
        }
        const params: {
            modelId: string;
            id: string;
            commentThread?: string;
            commentField?: string;
        } = { modelId: target.modelId, id: target.entryId };
        const threadId = notification.link?.threadId;
        if (threadId) {
            // Non-path params become query string; collaboration reads them on entry load.
            params.commentThread = threadId;
            if (notification.link?.locator) {
                params.commentField = notification.link.locator;
            }
        }
        router.goToRoute(CMS_ENTRIES_ROUTE, params);
    };

    return (
        <div
            className={
                notification.read ? "wby-notif-item" : "wby-notif-item wby-notif-item--unread"
            }
            onClick={open}
        >
            <Avatar
                size="lg"
                fallback={
                    <Avatar.Fallback
                        style={{ backgroundColor: avatarColor(actorName), color: "#fff" }}
                    >
                        {initials(actorName)}
                    </Avatar.Fallback>
                }
            />
            <div className="wby-notif-item__body">
                <div className="wby-notif-item__text">
                    <span className="wby-notif-item__strong">{actorName}</span>{" "}
                    {ACTION_TEXT[notification.type]}{" "}
                    {notification.title ? (
                        <span className="wby-notif-item__strong">{notification.title}</span>
                    ) : null}
                </div>
                {notification.snippet ? (
                    <div className="wby-notif-item__snippet">
                        {renderSnippet(notification.snippet)}
                    </div>
                ) : null}
                <div className="wby-notif-item__meta">
                    <span className="wby-notif-item__typeicon">{TYPE_ICON[notification.type]}</span>
                    <TimeAgo datetime={notification.createdOn} />
                </div>
            </div>

            {notification.read ? null : <span className="wby-notif-dot" />}
            <span className="wby-notif-archive">
                <IconButton
                    variant="ghost"
                    size="sm"
                    title={notification.archived ? "Move to inbox" : "Archive"}
                    aria-label={notification.archived ? "Move to inbox" : "Archive"}
                    onClick={event => {
                        event.stopPropagation();
                        void presenter.archive(notification.id);
                    }}
                    icon={notification.archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                />
            </span>
        </div>
    );
});
