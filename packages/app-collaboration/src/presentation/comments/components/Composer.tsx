import React from "react";
import { observer } from "mobx-react-lite";
import { useSecurity } from "@webiny/app-admin";
import { Avatar, Button, Tag } from "@webiny/admin-ui";
import type { CommentsPresenter } from "../abstractions.js";
import { avatarColor, initials } from "../styles.js";
import { MentionTextarea } from "./MentionTextarea.js";

interface Props {
    presenter: CommentsPresenter.Interface;
    activeLocator: string | null;
    resolveLabel: (locator: string) => string;
}

export const Composer = observer((props: Props) => {
    const { presenter, activeLocator, resolveLabel } = props;
    const { identity } = useSecurity();
    const authorName = identity?.displayName || "You";
    const { body, submitting } = presenter.vm.composer;

    return (
        <div className="wby-collab-composer">
            {activeLocator ? (
                <Tag
                    style={{ alignSelf: "flex-start" }}
                    content={resolveLabel(activeLocator)}
                    swatchColor="var(--color-primary)"
                    onDismiss={() => presenter.setActiveLocator(null)}
                    dismissIconLabel="Comment on the whole entry instead"
                />
            ) : (
                <Tag style={{ alignSelf: "flex-start" }} content="Whole entry" />
            )}

            <div className="wby-collab-composer__box">
                <div className="wby-collab-composer__row">
                    <Avatar
                        size="sm"
                        fallback={
                            <Avatar.Fallback
                                style={{
                                    backgroundColor: avatarColor(authorName),
                                    color: "#fff"
                                }}
                            >
                                {initials(authorName)}
                            </Avatar.Fallback>
                        }
                    />
                    <MentionTextarea
                        className="wby-collab-textarea"
                        value={body}
                        placeholder="Add a comment…"
                        autoFocus={!!activeLocator}
                        maxHeight={240}
                        users={presenter.vm.mentionableUsers}
                        excludeUserId={identity?.id}
                        onChange={value => presenter.setComposerBody(value)}
                        onMention={userId => presenter.addComposerMention(userId)}
                        onKeyDown={event => {
                            event.stopPropagation();
                            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                void presenter.submitComposer();
                            }
                        }}
                    />
                </div>
                <div className="wby-collab-composer__actions">
                    <Button
                        variant="ghost"
                        size="sm"
                        text="Cancel"
                        onClick={() => presenter.resetComposer()}
                        disabled={submitting || !body}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        text="Comment"
                        onClick={() => void presenter.submitComposer()}
                        disabled={submitting || !body.trim()}
                    />
                </div>
            </div>
        </div>
    );
});
