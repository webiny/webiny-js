import React, { useState, useCallback, useRef } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import { type editor } from "monaco-editor";
import { Button } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useSnackbar, useIdentity, useTenantContext } from "@webiny/app-admin";
import { config as appConfig } from "@webiny/app/config.js";
import { Webiny } from "@webiny/sdk";
import {
    Container,
    EditorContainer,
    OutputContainer,
    SplitPane,
    Toolbar,
    ToolbarActions
} from "./Playground.styles.js";
import { defaultSdkCode } from "./default-code.js";
import { SDK_TYPE_DEFINITIONS } from "./constants.js";

interface ConsoleMessage {
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: string;
}

const Playground: React.FC = () => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
    const [code, setCode] = useState(defaultSdkCode);
    const [output, setOutput] = useState<ConsoleMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { identity } = useIdentity();
    const { tenant } = useTenantContext();

    const handleRun = useCallback(async () => {
        if (!identity?.isAuthenticated) {
            showSnackbar("You must be logged in to use the SDK Playground");
            return;
        }

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
        const customConsole = {
            log: (...args: any[]) => {
                const message = args.map(arg => formatValue(arg)).join(" ");
                messages.push({ type: "log", message, timestamp: new Date().toISOString() });
                setOutput([...messages]);
            },
            error: (...args: any[]) => {
                const message = args.map(arg => formatValue(arg)).join(" ");
                messages.push({ type: "error", message, timestamp: new Date().toISOString() });
                setOutput([...messages]);
            },
            warn: (...args: any[]) => {
                const message = args.map(arg => formatValue(arg)).join(" ");
                messages.push({ type: "warn", message, timestamp: new Date().toISOString() });
                setOutput([...messages]);
            },
            info: (...args: any[]) => {
                const message = args.map(arg => formatValue(arg)).join(" ");
                messages.push({ type: "info", message, timestamp: new Date().toISOString() });
                setOutput([...messages]);
            }
        };

        try {
            // Create SDK instance with current tenant and API endpoint.
            // Note: The SDK will use cookie-based authentication (credentials: "include")
            // when running in the browser, as the admin app sets up the necessary cookies.
            const sdk = new Webiny({
                endpoint: apiUrl,
                tenant: tenant || identity?.currentTenant?.id || "root",
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
    }, [code, identity, tenant, showSnackbar]);

    // Configure Monaco editor with SDK types.
    const handleBeforeMount: BeforeMount = useCallback(monaco => {
        monacoRef.current = monaco;

        // Add TypeScript compiler options.
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: "React",
            allowJs: true,
            typeRoots: ["node_modules/@types"]
        });

        // Add SDK type definitions.
        Object.entries(SDK_TYPE_DEFINITIONS).forEach(([filename, content]) => {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                content,
                `file:///node_modules/@webiny/sdk/${filename}`
            );
        });

        // Add global SDK variable declaration.
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `
            import { Webiny, WebinyConfig } from "./sdk-types";
            declare global {
                interface Window {
                    sdk: Webiny;
                }
                const sdk: Webiny;
            }
            export {};
            `,
            "file:///global-sdk.d.ts"
        );
    }, []);

    const handleEditorDidMount: OnMount = useCallback(
        ed => {
            editorRef.current = ed;

            // Add keyboard shortcut for running code.
            const monaco = monacoRef.current;
            if (monaco) {
                ed.addAction({
                    id: "run-code",
                    label: "Run Code",
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                    run: () => {
                        void handleRun();
                    }
                });
            }
        },
        [handleRun]
    );

    return (
        <Container>
            <Toolbar>
                <div>
                    <strong>SDK Playground</strong>
                    <span style={{ marginLeft: 16, fontSize: 12, color: "#666" }}>
                        Use Ctrl+Enter to run code
                    </span>
                </div>
                <ToolbarActions>
                    <Button onClick={handleRun} disabled={isRunning}>
                        {isRunning ? "Running..." : "Run Code"}
                    </Button>
                </ToolbarActions>
            </Toolbar>
            <SplitPane>
                <EditorContainer>
                    {isRunning && <CircularProgress label="Running code..." />}
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        value={code}
                        onChange={value => value && setCode(value)}
                        beforeMount={handleBeforeMount}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            tabSize: 4,
                            insertSpaces: true,
                            formatOnPaste: true,
                            formatOnType: true,
                            suggest: {
                                showKeywords: true,
                                showSnippets: true
                            }
                        }}
                    />
                </EditorContainer>
                <OutputContainer>
                    <div
                        style={{
                            padding: 8,
                            borderBottom: "1px solid #e0e0e0",
                            fontWeight: "bold"
                        }}
                    >
                        Output
                    </div>
                    <div style={{ padding: 8, overflow: "auto", flex: 1 }}>
                        {output.length === 0 ? (
                            <div style={{ color: "#999", fontStyle: "italic" }}>
                                Click &quot;Run Code&quot; to see output here...
                            </div>
                        ) : (
                            output.map((msg, index) => <OutputLine key={index} message={msg} />)
                        )}
                    </div>
                </OutputContainer>
            </SplitPane>
        </Container>
    );
};

const OutputLine: React.FC<{ message: ConsoleMessage }> = ({ message }) => {
    const colors: Record<ConsoleMessage["type"], string> = {
        log: "#333",
        error: "#d32f2f",
        warn: "#f57c00",
        info: "#1976d2"
    };

    return (
        <div
            style={{
                color: colors[message.type],
                fontFamily: "monospace",
                fontSize: 13,
                marginBottom: 4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
            }}
        >
            <span style={{ color: "#999", fontSize: 11 }}>
                [{new Date(message.timestamp).toLocaleTimeString()}]
            </span>{" "}
            {message.message}
        </div>
    );
};

function formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === "function") return `[Function]`;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export default Playground;
