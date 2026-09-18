import { type ITraceEntry } from "./TraceRecorder.js";

interface ITraceNode {
    entry: ITraceEntry;
    depth: number;
}

/*
 * Phases are recorded flat, but they nest in practice (initializing the CLI contains rendering the
 * project config, which contains the child process fork). Rebuild the nesting from the timestamps: a
 * phase is a child of the closest still-open phase that fully contains it.
 */
const toNestedNodes = (entries: ITraceEntry[]): ITraceNode[] => {
    const nodes: ITraceNode[] = [];
    const open: ITraceEntry[] = [];

    for (const entry of entries) {
        while (open.length > 0 && open[open.length - 1].end < entry.end) {
            open.pop();
        }

        nodes.push({ entry, depth: open.length });
        open.push(entry);
    }

    return nodes;
};

/*
 * A run records a lot of phases that turn out to be instant — every command definition, every
 * extension type. Dropping the ones that round to zero and contain nothing keeps the report to the
 * handful of rows worth reading; a hidden phase is by definition not the bottleneck.
 */
const isWorthPrinting = (node: ITraceNode, index: number, nodes: ITraceNode[]) => {
    const duration = node.entry.end - node.entry.start;
    if (Math.round(duration) > 0) {
        return true;
    }

    const next = nodes[index + 1];

    return next !== undefined && next.depth > node.depth;
};

const formatRow = (label: string, duration: number, total: number, depth: number) => {
    const ms = `${Math.round(duration)} ms`.padStart(9);
    const share = `${((duration / total) * 100).toFixed(1)}%`.padStart(7);
    const indent = "  ".repeat(depth);

    return `${ms}  ${share}   ${indent}${label}`;
};

export const formatTraceReport = (
    processLabel: string,
    entries: ITraceEntry[],
    total: number
): string => {
    if (entries.length === 0) {
        return `${processLabel} trace: nothing was recorded.`;
    }

    const nodes = toNestedNodes(entries);
    const printableNodes = nodes.filter(isWorthPrinting);
    const hiddenCount = nodes.length - printableNodes.length;

    const lines = [`${processLabel} trace — ${Math.round(total)} ms total`, ""];

    for (const { entry, depth } of printableNodes) {
        const duration = entry.end - entry.start;
        let label = entry.label;
        if (entry.unfinished) {
            label = `${label} (still running at exit)`;
        }

        lines.push(formatRow(label, duration, total, depth));
    }

    const topLevelNodes = nodes.filter(node => node.depth === 0);
    const tracedTotal = topLevelNodes.reduce((sum, node) => {
        return sum + (node.entry.end - node.entry.start);
    }, 0);

    const untraced = total - tracedTotal;
    if (untraced > 1) {
        lines.push(formatRow("(untraced)", untraced, total, 0));
    }

    if (hiddenCount > 0) {
        lines.push("");
        lines.push(`${hiddenCount} phase(s) took under a millisecond and are not listed.`);
    }

    return lines.join("\n");
};
