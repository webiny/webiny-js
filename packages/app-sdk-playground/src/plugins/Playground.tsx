import React, { useState, useCallback, useRef, useEffect } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Button, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as AutoFixHighIcon } from "@webiny/icons/auto_fix_high.svg";
import { CircularProgress } from "@webiny/ui/Progress";
import { Loader } from "@webiny/admin-ui";
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
import { SDK_GLOBAL_DECLARATION } from "./constants.js";

interface ConsoleMessage {
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: string;
}

/* Minimum width for each pane as a percentage of total split width. */
const MIN_PANE_PCT = 20;

const Playground: React.FC = () => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const splitRef = useRef<HTMLDivElement | null>(null);
    /* Editor pane width as a percentage of the split container. */
    const [editorPct, setEditorPct] = useState(60);
    const isDragging = useRef(false);
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
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            allowJs: true
        });

        // Single addExtraLib call with a pure script-mode string (no import/export).
        // This makes TypeScript treat the file as an ambient script, so all
        // declare statements become true globals visible to user code.
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            SDK_GLOBAL_DECLARATION,
            "file:///sdk-globals.d.ts"
        );
    }, []);

    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !splitRef.current) {
                return;
            }
            const rect = splitRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setEditorPct(Math.min(100 - MIN_PANE_PCT, Math.max(MIN_PANE_PCT, pct)));
        };

        const onMouseUp = () => {
            if (!isDragging.current) {
                return;
            }
            isDragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    const handleFormat = useCallback(() => {
        editorRef.current?.getAction("editor.action.formatDocument")?.run();
    }, []);

    const handleEditorDidMount: OnMount = useCallback(
        (ed, monaco) => {
            editorRef.current = ed;

            // Re-create the model with a file:/// URI so it lives in the same
            // virtual FS namespace as the addExtraLib file, giving the TS
            // language service full visibility into the ambient declarations.
            const existingModel = ed.getModel();
            const newModel = monaco.editor.createModel(
                existingModel?.getValue() ?? defaultSdkCode,
                "typescript",
                monaco.Uri.parse("file:///user-script.ts")
            );
            ed.setModel(newModel);
            existingModel?.dispose();

            ed.addAction({
                id: "run-code",
                label: "Run Code",
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => {
                    void handleRun();
                }
            });
        },
        [handleRun]
    );

    return (
        <Container>
            <Toolbar>
                <div>
                    <strong>SDK Playground</strong>
                    <span style={{ marginLeft: 16, fontSize: 12, color: "#666" }}>
                        Use {navigator.platform.startsWith("Mac") ? "Cmd" : "Ctrl"}+Enter to run
                        code
                    </span>
                </div>
                <ToolbarActions>
                    <ButtonSecondary onClick={handleFormat} icon={<AutoFixHighIcon />}>
                        Format
                    </ButtonSecondary>
                    <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        icon={
                            isRunning ? (
                                <Loader size={"xs"} variant={"negative"} />
                            ) : (
                                <PlayArrowIcon />
                            )
                        }
                    >
                        {isRunning ? "Running..." : "Run Code"}
                    </Button>
                </ToolbarActions>
            </Toolbar>
            <SplitPane ref={splitRef}>
                <EditorContainer
                    style={{ flex: "none", width: `${editorPct}%` }}
                    onMouseMove={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.cursor =
                            e.clientX >= rect.right - 4 ? "col-resize" : "";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.cursor = "";
                    }}
                    onMouseDown={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        if (e.clientX >= rect.right - 4) {
                            handleDividerMouseDown(e);
                        }
                    }}
                >
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
                            renderLineHighlight: "none",
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
                <OutputContainer style={{ flex: 1, width: "auto", minWidth: `${MIN_PANE_PCT}%` }}>
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
