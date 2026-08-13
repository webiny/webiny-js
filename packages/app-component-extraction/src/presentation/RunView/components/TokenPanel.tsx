import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Heading, Loader, Scrollbar, Tag, Text } from "@webiny/admin-ui";
import { STAGE_LABELS, type Stage } from "~/constants.js";
import type { RunViewPresenter } from "../abstractions.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

// The model-backed stages (5, 6, 7) — the only ones with token usage.
const MODEL_STAGES: Stage[] = ["classify", "plan", "generate"];

const num = (value: number): string => value.toLocaleString();

/**
 * The token-usage panel (W7.9). Per-stage totals for the three model-backed stages and a run total,
 * read straight off the stage ledger's aggregates, followed by the individual call list (stage, call
 * name, tokens in/out, latency). Prompt/response bodies are out of scope this pass.
 */
export const TokenPanel = createReactiveComponent(function TokenPanel({ presenter }: Props) {
    const { vm } = presenter;
    const run = vm.run;
    if (!run) {
        return null;
    }

    const rows = MODEL_STAGES.map(stage => ({
        stage,
        usage: run.stages.find(entry => entry.stage === stage)?.modelUsage ?? null
    }));
    const total = rows.reduce(
        (acc, row) => ({
            input: acc.input + (row.usage?.inputTokens ?? 0),
            output: acc.output + (row.usage?.outputTokens ?? 0),
            calls: acc.calls + (row.usage?.calls ?? 0)
        }),
        { input: 0, output: 0, calls: 0 }
    );

    const calls = vm.modelCalls ?? [];

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-md py-sm border-b border-neutral-dimmed">
                <Heading level={6}>Token usage</Heading>
            </div>

            <Scrollbar>
                <div className="px-md py-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-neutral-strong">
                                <th className="text-left font-medium py-xs">Stage</th>
                                <th className="text-right font-medium py-xs">Calls</th>
                                <th className="text-right font-medium py-xs">Tokens in</th>
                                <th className="text-right font-medium py-xs">Tokens out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr key={row.stage} className="border-t border-neutral-dimmed">
                                    <td className="py-xs">{STAGE_LABELS[row.stage]}</td>
                                    <td className="text-right py-xs">
                                        {row.usage ? num(row.usage.calls) : "—"}
                                    </td>
                                    <td className="text-right py-xs font-mono">
                                        {row.usage ? num(row.usage.inputTokens) : "—"}
                                    </td>
                                    <td className="text-right py-xs font-mono">
                                        {row.usage ? num(row.usage.outputTokens) : "—"}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t border-neutral-strong font-medium">
                                <td className="py-xs">Run total</td>
                                <td className="text-right py-xs">{num(total.calls)}</td>
                                <td className="text-right py-xs font-mono">{num(total.input)}</td>
                                <td className="text-right py-xs font-mono">{num(total.output)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="px-md py-sm border-t border-neutral-dimmed">
                    <Text size="sm" className="font-medium">
                        Calls
                    </Text>
                    {vm.modelCallsLoading && calls.length === 0 ? (
                        <div className="py-md">
                            <Loader />
                        </div>
                    ) : calls.length === 0 ? (
                        <Text size="sm" className="text-neutral-strong">
                            No model calls recorded.
                        </Text>
                    ) : (
                        <table className="w-full text-sm mt-xs">
                            <thead>
                                <tr className="text-neutral-strong">
                                    <th className="text-left font-medium py-xs">Call</th>
                                    <th className="text-right font-medium py-xs">In</th>
                                    <th className="text-right font-medium py-xs">Out</th>
                                    <th className="text-right font-medium py-xs">Latency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calls.map((call, index) => (
                                    <tr key={index} className="border-t border-neutral-dimmed">
                                        <td className="py-xs">
                                            <div className="flex items-center gap-xs">
                                                <span className="font-mono">{call.name}</span>
                                                {call.ok ? null : (
                                                    <Tag variant="destructive" content="error" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-right py-xs font-mono">
                                            {num(call.inputTokens)}
                                        </td>
                                        <td className="text-right py-xs font-mono">
                                            {num(call.outputTokens)}
                                        </td>
                                        <td className="text-right py-xs font-mono">
                                            {num(Math.round(call.latencyMs))}ms
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Scrollbar>
        </div>
    );
});
