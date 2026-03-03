import { useCallback, useState } from "react";
import type { MutableRefObject } from "react";
import type { editor } from "monaco-editor";
import { useSnackbar, useTenantContext } from "@webiny/app-admin";
import { config as appConfig } from "@webiny/app/config.js";
import { Webiny } from "@webiny/sdk";
import type { ConsoleMessage } from "./types.js";
import { createCustomConsole } from "./consoleCapture.js";

export function useCodeExecution(
    code: string,
    editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>
) {
    const [output, setOutput] = useState<ConsoleMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { tenant } = useTenantContext();

    const handleRun = useCallback(async () => {
        const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL) as string;
        if (!apiUrl) {
            showSnackbar("API URL is not configured");
            return;
        }

        const currentCode = editorRef.current?.getValue() || code;
        setIsRunning(true);
        setOutput([]);

        const messages: ConsoleMessage[] = [];

        // Create custom console for capturing output.
        const customConsole = createCustomConsole(messages, setOutput);

        try {
            // Create SDK instance with current tenant and API endpoint.
            // Note: The SDK will use cookie-based authentication (credentials: "include")
            // when running in the browser, as the admin app sets up the necessary cookies.
            const sdk = new Webiny({
                endpoint: apiUrl,
                tenant: tenant || undefined,
                headers: {
                    // Add any additional headers if needed.
                    // The Authorization header with Bearer token is handled via cookies
                    // when running within the admin app context.
                }
            });

            // Wrap code in async function to allow top-level await.
            const wrappedCode = `
                (async () => {
                    try {
                        ${currentCode}
                    } catch (error) {
                        console.error("Runtime error:", error);
                        throw error;
                    }
                })()
            `;

            // Create function with injected dependencies.
            const fn = new Function("console", "sdk", "window", wrappedCode);

            // Execute with custom console and SDK.
            const result = fn(customConsole, sdk, { sdk });

            // Handle async results.
            if (result && typeof result.then === "function") {
                await result;
            }
        } catch (error) {
            customConsole.error("Execution error:", error);
        } finally {
            setIsRunning(false);
        }
    }, [code, editorRef, showSnackbar, tenant]);

    return {
        output,
        isRunning,
        handleRun
    };
}
