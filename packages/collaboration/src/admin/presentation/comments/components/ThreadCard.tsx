import React, { useEffect, useRef, useState } from "react";
import { createReactiveComponent, useSecurity } from "@webiny/app-admin";
import { Button, DropdownMenu, IconButton } from "@webiny/admin-ui";
import { ReactComponent as ArrowOutwardIcon } from "@webiny/icons/arrow_outward.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { Message } from "./Message.js";
import { MentionTextarea } from "./MentionTextarea.js";
import { COLLAB_THREAD_PARAM, COLLAB_FIELD_PARAM } from "~/admin/constants.js";
import type { CollabThread } from "~/admin/types.js";

interface Props {
    presenter: CommentsPresenter.Interface;
    thread: CollabThread;
    onJumpToField: (locator: string) => void;
}

const fieldLabel = (thread: CollabThread): string => {
    const path = thread.anchor.path || [];
    const label = thread.anchor.label || thread.locator;
    return [...path, label].join(" › ");
};

export const ThreadCard = createReactiveComponent((props: Props) => {
    const { presenter, thread, onJumpToField } = props;
    const { identity } = useSecurity();
    const currentUserId = identity?.id;
    const [reply, setReply] = useState("");
    const [replyMentions, setReplyMentions] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    const messages = thread.messages.filter(message => !message.deleted);
    const mentionNames = presenter.vm.mentionableUsers.map(user => user.displayName);

    const highlighted = presenter.vm.highlightThreadId === thread.id;
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!highlighted || !rootRef.current) {
            return;
        }
        rootRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        const timer = window.setTimeout(() => presenter.clearHighlight(), 2600);
        return () => window.clearTimeout(timer);
    }, [highlighted, presenter]);

    const rootClassName = [
        "wby-collab-thread",
        thread.resolved ? "wby-collab-thread--resolved" : "",
        highlighted ? "wby-collab-thread--highlight" : ""
    ]
        .filter(Boolean)
        .join(" ");

    // Builds a shareable link to this thread by augmenting the current entry URL with the
    // deep-link query params. Opening it re-runs the panel-open + highlight + field-scroll flow.
    const copyThreadLink = () => {
        const url = new URL(window.location.href);
        url.searchParams.set(COLLAB_THREAD_PARAM, thread.id);
        if (thread.locator) {
            url.searchParams.set(COLLAB_FIELD_PARAM, thread.locator);
        } else {
            url.searchParams.delete(COLLAB_FIELD_PARAM);
        }
        const done = () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        };
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(url.toString()).then(done, done);
        } else {
            done();
        }
    };

    const submitReply = async () => {
        if (!reply.trim() || busy) {
            return;
        }
        setBusy(true);
        try {
            await presenter.submitReply(thread.id, reply, replyMentions);
            setReply("");
            setReplyMentions([]);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={rootClassName} ref={rootRef}>
            <div className="wby-collab-thread__head">
                {thread.locator ? (
                    <button
                        className="wby-collab-chip"
                        title="Jump to field"
                        onClick={() => onJumpToField(thread.locator)}
                    >
                        <span className="wby-collab-chip__label">{fieldLabel(thread)}</span>
                        <ArrowOutwardIcon className="wby-collab-chip__jump" />
                    </button>
                ) : (
                    <span className="wby-collab-chip wby-collab-chip--entry">
                        <span className="wby-collab-chip__label">{fieldLabel(thread)}</span>
                    </span>
                )}

                <div className="wby-collab-thread__head-actions">
                    <Button
                        variant="tertiary"
                        size="sm"
                        icon={<CheckCircleIcon />}
                        text={thread.resolved ? "Reopen" : "Resolve"}
                        title={thread.resolved ? "Reopen thread" : "Resolve thread"}
                        onClick={() =>
                            thread.resolved
                                ? presenter.reopen(thread.id)
                                : presenter.resolve(thread.id)
                        }
                    />
                    <DropdownMenu
                        trigger={
                            <IconButton
                                variant="ghost"
                                size="sm"
                                icon={<MoreHorizIcon />}
                                title="More"
                                aria-label="More actions"
                            />
                        }
                    >
                        <DropdownMenu.Item
                            icon={<CheckCircleIcon />}
                            text={thread.resolved ? "Reopen thread" : "Resolve thread"}
                            onClick={() =>
                                thread.resolved
                                    ? presenter.reopen(thread.id)
                                    : presenter.resolve(thread.id)
                            }
                        />
                        <DropdownMenu.Item
                            icon={<LinkIcon />}
                            text={copied ? "Copied!" : "Copy link to thread"}
                            onClick={copyThreadLink}
                            preventClose
                        />
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                            variant="destructive"
                            icon={<DeleteIcon />}
                            text="Delete thread"
                            onClick={() => presenter.remove(thread.id)}
                        />
                    </DropdownMenu>
                </div>
            </div>

            {thread.anchor.exists ? null : (
                <div className="wby-collab-banner">
                    This field no longer exists in the current revision.
                </div>
            )}

            {messages.map((message, index) => (
                <Message
                    key={message.id}
                    presenter={presenter}
                    threadId={thread.id}
                    message={message}
                    nested={index > 0}
                    canManage={!!currentUserId && currentUserId === message.createdBy.id}
                    mentionNames={mentionNames}
                />
            ))}

            {thread.resolved ? (
                <div className="wby-collab-resolved-by">
                    Resolved by {thread.resolvedBy?.displayName || "someone"}
                </div>
            ) : (
                <div className="wby-collab-replybar">
                    <MentionTextarea
                        className="wby-collab-reply-input"
                        value={reply}
                        placeholder="Reply…"
                        maxHeight={160}
                        users={presenter.vm.mentionableUsers}
                        excludeUserId={currentUserId}
                        onChange={setReply}
                        onMention={userId =>
                            setReplyMentions(current =>
                                current.includes(userId) ? current : [...current, userId]
                            )
                        }
                        onKeyDown={event => {
                            event.stopPropagation();
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void submitReply();
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
});
