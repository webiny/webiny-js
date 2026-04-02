import { useSnackbar, useTenantContext } from "@webiny/app-admin";
import { AuthenticationContextFeature } from "@webiny/app-admin/features/security/AuthenticationContext/feature.js";
import { useFeature } from "@webiny/app";
import { config as appConfig } from "@webiny/app/config.js";
import { Webiny } from "@webiny/sdk";
import type { editor } from "monaco-editor";
import type { MutableRefObject } from "react";
import { useCallback, useState } from "react";
import { createCustomConsole } from "./consoleCapture.js";
import type { ConsoleMessage } from "./types.js";

export function useCodeExecution(
    code: string,
    editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>
) {
    const [output, setOutput] = useState<ConsoleMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { tenant } = useTenantContext();
    const { authenticationContext } = useFeature(AuthenticationContextFeature);

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
            const sdk = new Webiny({
                endpoint: apiUrl,
                tenant: tenant || undefined,
                token: () => authenticationContext.getIdToken() as Promise<string>
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
    }, [code, editorRef, showSnackbar, tenant, authenticationContext]);

    return {
        output,
        isRunning,
        handleRun
    };
}
