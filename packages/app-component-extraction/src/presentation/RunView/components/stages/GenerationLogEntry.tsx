import React, { useState } from "react";
import { Button, Text } from "@webiny/admin-ui";
import type { GenerationLogEntryDto } from "~/shared/types.js";
import type { GenerationPromptState } from "../../abstractions.js";

interface Props {
    entry: GenerationLogEntryDto;
    prompt: GenerationPromptState | undefined;
}

const number = (value: number) => value.toLocaleString();

const OUTCOME: Record<GenerationLogEntryDto["outcome"], string> = {
    passed: "Passed every check",
    "failed-checks": "Answered, failed checks",
    "call-failed": "No answer"
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex gap-sm">
        <Text size="sm" className="w-36 shrink-0 text-neutral-strong">
            {label}
        </Text>
        <Text size="sm" className="min-w-0 break-words">
            {children}
        </Text>
    </div>
);

const Block = ({ text }: { text: string }) => (
    <pre className="max-h-[32rem] overflow-auto rounded-sm bg-neutral-dimmed p-sm text-sm whitespace-pre-wrap">
        {text}
    </pre>
);

/**
 * One generation attempt: what was sent, what it cost and how it ended. The prompt is loaded when the
 * attempt is opened; the system prompt, the same for every attempt, is folded away until asked for.
 */
export const GenerationLogEntry = ({ entry, prompt }: Props) => {
    const [showSystem, setShowSystem] = useState(false);
    const usage = entry.usage;

    return (
        <div className="flex flex-col gap-sm">
            <div className="flex flex-col gap-xxs">
                <Row label="Model">{entry.model || "unknown"}</Row>
                <Row label="Tokens in">
                    {usage
                        ? `${number(usage.inputTokens)} (cache read ${number(usage.cacheReadTokens)}, cache write ${number(usage.cacheWriteTokens)})`
                        : "not reported — the call returned no usage"}
                </Row>
                <Row label="Tokens out">{usage ? number(usage.outputTokens) : "not reported"}</Row>
                <Row label="Duration">{`${(entry.durationMs / 1000).toFixed(1)}s`}</Row>
                {entry.finishReason ? <Row label="Finish reason">{entry.finishReason}</Row> : null}
                {entry.outputChars !== undefined ? (
                    <Row label="Answer length">{`${number(entry.outputChars)} characters`}</Row>
                ) : null}
                <Row label="Outcome">{OUTCOME[entry.outcome]}</Row>
                {entry.error ? <Row label="Error">{entry.error}</Row> : null}
                {entry.failures.length > 0 ? (
                    <Row label="Failures">
                        <ul className="m-0 list-disc pl-md">
                            {entry.failures.map((failure, index) => (
                                <li key={index}>{failure}</li>
                            ))}
                        </ul>
                    </Row>
                ) : null}
                <Row label="Generate version">{`v${entry.stageVersion}`}</Row>
            </div>

            {!prompt || prompt.loading ? (
                <Text size="sm" className="text-neutral-strong">
                    Loading the prompt…
                </Text>
            ) : prompt.error ? (
                <Text size="sm" className="text-destructive-primary">
                    {`The prompt could not be loaded: ${prompt.error}`}
                </Text>
            ) : !prompt.prompt ? (
                <Text size="sm" className="text-neutral-strong">
                    No prompt recorded for this attempt.
                </Text>
            ) : (
                <div className="flex flex-col gap-sm">
                    <div className="flex flex-col gap-xxs">
                        <Text size="sm" className="font-semibold">
                            {`User message (${number(prompt.prompt.user.length)} characters)`}
                        </Text>
                        <Block text={prompt.prompt.user} />
                    </div>
                    <Row label="Images sent">
                        {prompt.prompt.imageFileIds.length > 0
                            ? `${prompt.prompt.imageFileIds.length} — the section's reference crop (File Manager ${prompt.prompt.imageFileIds.join(", ")})`
                            : "none"}
                    </Row>
                    <div className="flex flex-col gap-xxs">
                        <Button
                            variant="tertiary"
                            size="sm"
                            className="self-start"
                            text={
                                showSystem
                                    ? "Hide system prompt"
                                    : `Show system prompt (${number(prompt.prompt.system.length)} characters)`
                            }
                            onClick={() => setShowSystem(open => !open)}
                        />
                        {showSystem ? <Block text={prompt.prompt.system} /> : null}
                    </div>
                </div>
            )}
        </div>
    );
};
