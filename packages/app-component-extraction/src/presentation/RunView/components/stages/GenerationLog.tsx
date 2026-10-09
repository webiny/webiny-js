import React from "react";
import { Accordion, Text } from "@webiny/admin-ui";
import type { GenerationLogEntryDto } from "~/shared/types.js";
import type { GenerationLogState, GenerationPromptState } from "../../abstractions.js";
import { GenerationLogEntry } from "./GenerationLogEntry.js";

interface Props {
    state: GenerationLogState | undefined;
    prompts: Record<string, GenerationPromptState>;
    onOpenEntry: (entryId: string) => void;
}

const OUTCOME: Record<GenerationLogEntryDto["outcome"], string> = {
    passed: "passed",
    "failed-checks": "failed checks",
    "call-failed": "no answer"
};

const TRIGGER: Record<GenerationLogEntryDto["trigger"], string> = {
    generate: "Generate",
    "generate-again": "Generate again",
    refine: "Regenerate with instruction",
    experiment: "Prompt experiment",
    install: "Installed logged attempt"
};

const subtitle = (entry: GenerationLogEntryDto): string => {
    const when = new Date(entry.recordedOn).toLocaleTimeString();
    const tokens = entry.usage
        ? ` · in ${entry.usage.inputTokens.toLocaleString()} / out ${entry.usage.outputTokens.toLocaleString()}`
        : "";
    return `${when} · ${(entry.durationMs / 1000).toFixed(0)}s · ${OUTCOME[entry.outcome]}${tokens}`;
};

/**
 * A component's generation log: one item per attempt, newest first — the stage's attempts and every
 * "generate again" — each opening onto its model, tokens, duration, outcome and prompt.
 */
export const GenerationLog = ({ state, prompts, onOpenEntry }: Props) => {
    if (!state || (state.loading && state.entries.length === 0)) {
        return (
            <Text size="sm" className="text-neutral-strong">
                Loading the generation log…
            </Text>
        );
    }
    if (state.error) {
        return (
            <Text size="sm" className="text-destructive-primary">
                {`The generation log could not be loaded: ${state.error}`}
            </Text>
        );
    }
    if (state.entries.length === 0) {
        return (
            <Text size="sm" className="text-neutral-strong">
                No attempts recorded. The log starts with the first generation after it was added;
                generate this component again to see one.
            </Text>
        );
    }

    const entries = [...state.entries].reverse();
    return (
        <Accordion variant="container" background="base">
            {entries.map(entry => (
                <Accordion.Item
                    key={entry.id}
                    title={`Attempt ${entry.attempt} of ${entry.maxAttempts} · ${TRIGGER[entry.trigger]}${entry.experiment ? ` "${entry.experiment.label}" (without ${entry.experiment.ablate.join(", ") || "nothing"})` : ""}`}
                    subtitle={subtitle(entry)}
                    onOpenChange={open => {
                        if (open) {
                            onOpenEntry(entry.id);
                        }
                    }}
                >
                    <GenerationLogEntry entry={entry} prompt={prompts[entry.id]} />
                </Accordion.Item>
            ))}
        </Accordion>
    );
};
