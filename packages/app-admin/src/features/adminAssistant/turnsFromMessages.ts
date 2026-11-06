import type { AdminAssistantMessage } from "./abstractions.js";
import type { AiTurnViewModel } from "./abstractions.js";

/** A rebuilt turn, with the messages that let the conversation carry on from it. */
export interface RestoredTurn extends AiTurnViewModel {
    messages: AdminAssistantMessage[];
}

interface Part {
    type?: unknown;
    text?: unknown;
    toolName?: unknown;
    input?: { questions?: unknown };
    output?: { type?: unknown };
}

/*
 * The tool the server's assistant calls to hand over follow-up questions. It is how the answer
 * ends, not work the user asked for, so the live stream never reports it as a tool, and neither does
 * a reopened chat. Mirrors `FOLLOW_UPS_TOOL` in `@webiny/ai-powerups`, which the admin cannot import.
 */
const FOLLOW_UPS_TOOL = "suggestFollowUps";
const MAX_FOLLOW_UPS = 3;

const followUpsOf = (part: Part): string[] => {
    const questions = part.input?.questions;
    if (!Array.isArray(questions)) {
        return [];
    }

    const result: string[] = [];
    for (const question of questions) {
        if (typeof question === "string" && question.trim()) {
            result.push(question.trim());
        }
    }
    return result.slice(0, MAX_FOLLOW_UPS);
};

const partsOf = (message: AdminAssistantMessage): Part[] => {
    if (!Array.isArray(message.content)) {
        return [];
    }
    return message.content.filter(
        (part): part is Part => typeof part === "object" && part !== null
    );
};

const textOf = (message: AdminAssistantMessage): string => {
    if (typeof message.content === "string") {
        return message.content;
    }

    const texts: string[] = [];
    for (const part of partsOf(message)) {
        if (part.type === "text" && typeof part.text === "string") {
            texts.push(part.text);
        }
    }
    return texts.join("");
};

const FAILED_OUTPUTS = new Set(["error-text", "error-json"]);

const startTurn = (question: string): RestoredTurn => ({
    question,
    text: "",
    answerStart: 0,
    tools: [],
    completed: [],
    failed: [],
    running: false,
    pendingApprovals: [],
    followUps: [],
    messages: [],
    settled: true
});

/** Reads what an assistant or tool message adds to the turn it belongs to. */
const addToTurn = (turn: RestoredTurn, message: AdminAssistantMessage): void => {
    turn.messages.push(message);

    if (message.role === "assistant") {
        // Each assistant message is a step. Steps were streamed as one answer, a paragraph apart.
        const text = textOf(message);
        if (text) {
            turn.text = turn.text ? `${turn.text}\n\n${text}` : text;
        }

        for (const part of partsOf(message)) {
            if (part.type !== "tool-call" || typeof part.toolName !== "string") {
                continue;
            }
            if (part.toolName === FOLLOW_UPS_TOOL) {
                turn.followUps = followUpsOf(part);
                continue;
            }
            turn.tools.push(part.toolName);
            turn.answerStart = turn.text.length;
        }
        return;
    }

    if (message.role !== "tool") {
        return;
    }

    for (const part of partsOf(message)) {
        if (part.type !== "tool-result" || typeof part.toolName !== "string") {
            continue;
        }
        if (part.toolName === FOLLOW_UPS_TOOL) {
            continue;
        }
        if (FAILED_OUTPUTS.has(String(part.output?.type))) {
            turn.failed.push(part.toolName);
        } else {
            turn.completed.push(part.toolName);
        }
    }
};

/**
 * Turns a saved conversation back into the turns the palette shows.
 *
 * The inverse of how the assistant replays a conversation: every user message starts a turn, and
 * the assistant and tool messages after it are that turn's, kept verbatim so a follow-up replays
 * exactly what was saved. The follow-up questions come from the call that suggested them, so a
 * reopened chat offers the same ones it ended with.
 */
export const turnsFromMessages = (messages: AdminAssistantMessage[]): RestoredTurn[] => {
    const turns: RestoredTurn[] = [];

    for (const message of messages) {
        if (message.role === "user") {
            const question = textOf(message);
            turns.push(startTurn(question));
            continue;
        }

        const current = turns[turns.length - 1];
        if (current) {
            addToTurn(current, message);
        }
    }

    return turns;
};
