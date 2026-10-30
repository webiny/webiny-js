import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AI_SUGGESTIONS } from "~/CommandPalette/components/index.js";
import { AnswerSkeleton } from "~/CommandPalette/components/index.js";
import { AssistantMessage } from "./AssistantMessage.js";
import { ChatComposer } from "./ChatComposer.js";
import { ChatSuggestions } from "./ChatSuggestions.js";
import { ChatTurn } from "./ChatTurn.js";

export interface ChatConversationProps {
    assistant: AdminAssistantPresenter.Interface;
    /** The signed-in user's first name, for the greeting. Empty when the profile has none. */
    firstName: string;
}

/*
 * The starter questions before anything is asked, then the newest answer's own follow-ups. Nothing
 * while a run is going, or while a turn waits on an approval, since its Run button comes first.
 */
const suggestionsFor = (turns: AiTurnViewModel[], busy: boolean): string[] => {
    if (turns.length === 0) {
        return AI_SUGGESTIONS.map(suggestion => suggestion.question);
    }

    const latest = turns[turns.length - 1];
    if (busy || !latest.settled || latest.error || latest.pendingApprovals.length > 0) {
        return [];
    }
    return latest.followUps;
};

/**
 * The conversation the assistant holds, oldest turn first, the way a chat reads.
 *
 * The palette shows the same turns newest first and folds the older ones away, because it is built
 * for a quick ask. Here the whole exchange is the point, so every turn stays open.
 */
export const ChatConversation = ({ assistant, firstName }: ChatConversationProps) => {
    const { turns, busy, opening, storageError } = assistant.vm;
    const scrollRef = useRef<HTMLDivElement>(null);

    const ask = (question: string) => assistant.ask(question);
    const waiting = busy || opening;
    const suggestions = suggestionsFor(turns, waiting);

    /*
     * Keep the newest turn in view as it streams in. The suggestions land after the answer and take
     * room from the scroll area, so they are a change of their own.
     */
    const lastText = turns[turns.length - 1]?.text;
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [turns.length, lastText, suggestions.length]);
    const greeting = firstName ? `Hi ${firstName}, I'm` : "Hi, I'm";

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/*
             * `[&>div]:!block` overrides Radix's `display: table` content wrapper, which grows to fit
             * its widest child; a wide answer table then widened the whole conversation past the
             * panel and clipped it on the right.
             */}
            <ScrollArea
                className="min-h-0 flex-1"
                viewportClassName="p-lg [&>div]:!block"
                viewportRef={scrollRef}
            >
                <div className="flex flex-col gap-lg">
                    <AssistantMessage>
                        <div>
                            {greeting} <strong>Webiny AI assistant</strong>. Ask me about this
                            project, or ask me to change something. I&apos;ll show you the plan and
                            wait for your go-ahead before I change anything.
                        </div>
                    </AssistantMessage>
                    {opening ? <AnswerSkeleton /> : null}
                    {turns.map((turn, index) => (
                        <ChatTurn
                            key={index}
                            turn={turn}
                            busy={busy}
                            onApprove={() => assistant.decide(index, true)}
                            onReject={() => assistant.decide(index, false)}
                        />
                    ))}
                </div>
            </ScrollArea>
            {storageError ? (
                <Text as="div" size="sm" className="px-lg pb-sm text-destructive-primary">
                    Not saved: {storageError}
                </Text>
            ) : null}
            <ChatSuggestions questions={suggestions} disabled={waiting} onAsk={ask} />
            <ChatComposer
                placeholder={turns.length > 0 ? "Ask a follow-up…" : "Ask about this project…"}
                busy={waiting}
                onAsk={ask}
            />
        </div>
    );
};
