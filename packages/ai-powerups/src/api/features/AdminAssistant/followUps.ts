import { tool } from "ai";
import { z } from "zod";

export const FOLLOW_UPS_TOOL = "suggestFollowUps";

/** More than this and the chips wrap onto a second row in the palette. */
const MAX_FOLLOW_UPS = 3;

/*
 * No `.max()` here. The SDK validates the input against this schema, and a model that sends four
 * questions would have the whole call rejected. `readFollowUps` keeps the first three instead.
 */
const inputSchema = z.object({
    questions: z
        .array(z.string())
        .describe(
            `Up to ${MAX_FOLLOW_UPS} short questions the user is likely to ask next, in their own voice.`
        )
});

/**
 * How the model hands the palette its follow-up suggestions.
 *
 * A tool rather than a convention in the answer text: the text streams to the screen as it arrives,
 * so a trailing marker would flash up before anything could strip it. The input arrives as one typed
 * value instead.
 *
 * Defined here, not registered as an `AiSdkToolDefinition`. Those are offered to every AI caller,
 * and suggesting a next question only means something in the palette.
 *
 * The loop stops as soon as this is called (see `AdminAssistantUseCase`), so it costs no extra model
 * step. `execute` exists only because the SDK needs a result to record in the history the client
 * replays.
 */
export const followUpsTool = tool({
    description:
        "Call once, last, after you have answered, with up to three follow-up questions. Do not call it when your answer is an error, or when you have proposed a change that waits for approval.",
    inputSchema,
    execute: async () => "Shown to the user."
});

/** The questions from a call's input, or none when the model sent something else. */
export const readFollowUps = (input: unknown): string[] => {
    const parsed = inputSchema.safeParse(input);

    if (!parsed.success) {
        return [];
    }

    return parsed.data.questions
        .map(question => question.trim())
        .filter(Boolean)
        .slice(0, MAX_FOLLOW_UPS);
};
