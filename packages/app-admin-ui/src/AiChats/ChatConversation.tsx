import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { AiSuggestions } from "~/CommandPalette/components/index.js";
import { AiTurn } from "~/CommandPalette/components/index.js";
import { AnswerSkeleton } from "~/CommandPalette/components/index.js";
import { ChatComposer } from "./ChatComposer.js";

export interface ChatConversationProps {
    assistant: AdminAssistantPresenter.Interface;
    initials: string;
}

/**
 * The conversation the assistant holds, oldest turn first, the way a chat reads.
 *
 * The palette shows the same turns newest first and folds the older ones away, because it is built
 * for a quick ask. Here the whole exchange is the point, so every turn stays open.
 */
export const ChatConversation = ({ assistant, initials }: ChatConversationProps) => {
    const { turns, busy, opening, storageError } = assistant.vm;
    const scrollRef = useRef<HTMLDivElement>(null);

    /*
     * Keep the newest turn in view as it streams in. The follow-ups land after the text, so they are
     * a change of their own.
     */
    const latest = turns[turns.length - 1];
    const lastText = latest?.text;
    const lastFollowUps = latest?.followUps.length;
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [turns.length, lastText, lastFollowUps]);

    const ask = (question: string) => assistant.ask(question);
    const newest = turns.length - 1;

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1" viewportClassName="p-sm" viewportRef={scrollRef}>
                {opening ? (
                    <div className="px-sm py-md">
                        <AnswerSkeleton />
                    </div>
                ) : null}
                {!opening && turns.length === 0 ? <AiSuggestions onAsk={ask} /> : null}
                {turns.map((turn, index) => (
                    <AiTurn
                        key={index}
                        turn={turn}
                        initials={initials}
                        latest={index === newest}
                        busy={busy}
                        onApprove={() => assistant.decide(index, true)}
                        onReject={() => assistant.decide(index, false)}
                        onAsk={ask}
                    />
                ))}
            </ScrollArea>
            {storageError ? (
                <Text as="div" size="sm" className="px-md pb-xs text-destructive-primary">
                    Not saved: {storageError}
                </Text>
            ) : null}
            <ChatComposer
                placeholder={turns.length > 0 ? "Ask a follow-up…" : "Ask about this project…"}
                busy={busy || opening}
                onAsk={ask}
            />
        </div>
    );
};
