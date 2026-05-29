import React, { useState, useRef, useEffect, useCallback } from "react";
import { useWebLlm } from "./useWebLlm.js";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

const SYSTEM_PROMPT = "You are a helpful assistant running locally in the browser via WebLLM.";

export const ChatPage = () => {
    const { engine, status } = useWebLlm();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [generating, setGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || !engine || generating) {
            return;
        }

        const userMessage: ChatMessage = { role: "user", content: trimmed };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setGenerating(true);

        const apiMessages: ChatCompletionMessageParam[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam)
        ];

        try {
            const assistantMessage: ChatMessage = { role: "assistant", content: "" };
            setMessages([...updatedMessages, assistantMessage]);

            const response = await engine.chat.completions.create({
                messages: apiMessages,
                stream: true
            });

            let accumulated = "";
            for await (const chunk of response) {
                const delta = chunk.choices[0]?.delta?.content;
                if (delta) {
                    accumulated += delta;
                    setMessages([...updatedMessages, { role: "assistant", content: accumulated }]);
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setMessages([...updatedMessages, { role: "assistant", content: `Error: ${errorMsg}` }]);
        } finally {
            setGenerating(false);
        }
    }, [input, engine, generating, messages]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const isReady = status === "ready";

    return (
        <div style={styles.container}>
            <div style={styles.messagesArea}>
                {!isReady ? (
                    <div style={styles.statusBanner}>
                        {status === "loading" ? "Loading model..." : null}
                        {status === "error" ? "Failed to load model." : null}
                        {status === "idle" ? "Model not loaded." : null}
                    </div>
                ) : null}

                {messages.length === 0 && isReady ? (
                    <div style={styles.emptyState}>Send a message to start chatting.</div>
                ) : null}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            ...styles.messageBubble,
                            ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
                        }}
                    >
                        <div style={styles.roleLabel}>{msg.role === "user" ? "You" : "Assistant"}</div>
                        <div style={styles.messageContent}>{msg.content}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputArea}>
                <textarea
                    ref={textareaRef}
                    style={styles.textarea}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isReady ? "Type a message... (Enter to send, Shift+Enter for newline)" : "Waiting for model to load..."}
                    disabled={!isReady || generating}
                    rows={2}
                />
                <button
                    style={{
                        ...styles.sendButton,
                        ...(!isReady || generating || !input.trim() ? styles.sendButtonDisabled : {})
                    }}
                    onClick={handleSend}
                    disabled={!isReady || generating || !input.trim()}
                >
                    {generating ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 64px)",
        overflow: "hidden"
    },
    messagesArea: {
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    statusBanner: {
        textAlign: "center",
        padding: "40px 20px",
        color: "#888",
        fontSize: "14px"
    },
    emptyState: {
        textAlign: "center",
        padding: "40px 20px",
        color: "#888",
        fontSize: "14px"
    },
    messageBubble: {
        maxWidth: "70%",
        padding: "12px 16px",
        borderRadius: "12px",
        fontSize: "14px",
        lineHeight: "1.5",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "var(--wby-theme-primary, #6C5CE7)",
        color: "#fff"
    },
    assistantBubble: {
        alignSelf: "flex-start",
        backgroundColor: "var(--wby-surface-elevated, #f0f0f0)",
        color: "var(--wby-text-primary, #333)"
    },
    roleLabel: {
        fontSize: "11px",
        fontWeight: 600,
        marginBottom: "4px",
        opacity: 0.7
    },
    messageContent: {
        fontSize: "14px"
    },
    inputArea: {
        display: "flex",
        gap: "8px",
        padding: "16px 24px",
        borderTop: "1px solid var(--wby-border-default, #e0e0e0)"
    },
    textarea: {
        flex: 1,
        padding: "10px 14px",
        border: "1px solid var(--wby-border-default, #e0e0e0)",
        borderRadius: "8px",
        fontSize: "14px",
        fontFamily: "inherit",
        resize: "none",
        outline: "none",
        backgroundColor: "var(--wby-surface-default, #fff)",
        color: "var(--wby-text-primary, #333)"
    },
    sendButton: {
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "var(--wby-theme-primary, #6C5CE7)",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        alignSelf: "flex-end"
    },
    sendButtonDisabled: {
        opacity: 0.5,
        cursor: "not-allowed"
    }
};
