import type React from "react";

export interface CommandRow {
    key: string;
    /* Lowercased search/selection value used by cmdk. */
    value: string;
    label: string;
    sub?: string;
    icon?: React.ReactNode;
    shortcut?: string[];
    /* Verb shown in the "run" pill on the selected row, e.g. "Open" / "Run". */
    verb: string;
    onRun: () => void;
}

export interface CommandGroup {
    title: string;
    rows: CommandRow[];
}
