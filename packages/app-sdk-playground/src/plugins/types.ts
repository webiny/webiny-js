export interface ConsoleMessage {
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: string;
}

// Minimum width for each pane as a percentage of total split width.
export const MIN_PANE_PCT = 20;
