import React from "react";
import type { CommentsPresenter } from "../abstractions.js";
import { ThreadCard } from "./ThreadCard.js";
import type { CollabThread } from "~/admin/types.js";

interface ThreadListProps {
    threads: CollabThread[];
    presenter: CommentsPresenter.Interface;
    onJumpToField: (locator: string) => void;
}

export const ThreadList = ({ threads, presenter, onJumpToField }: ThreadListProps) => {
    if (threads.length === 0) {
        return null;
    }
    return (
        <>
            {threads.map(thread => (
                <ThreadCard
                    key={thread.id}
                    presenter={presenter}
                    thread={thread}
                    onJumpToField={onJumpToField}
                />
            ))}
        </>
    );
};
