import { debuggerStore } from "./DebuggerStore.js";

const buildReport = () => {
    return {
        generatedAt: new Date().toISOString(),
        namespaces: debuggerStore.namespaces,
        sessions: debuggerStore.sessions
    };
};

/**
 * Hands the collected sessions to the user as a file.
 *
 * Nothing is uploaded anywhere. The report leaves the browser only when the person chooses to send
 * it, which is the moment they decide this data may leave their organisation.
 */
export const downloadReport = () => {
    const blob = new Blob([JSON.stringify(buildReport(), null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `webiny-debug-${new Date().toISOString()}.json`;
    link.click();

    URL.revokeObjectURL(url);
};
