import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { Dialog } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { AiEnrichmentFeature } from "./feature.js";

const { FileDetails } = FileManagerViewConfig;

type Status = "idle" | "running" | "done" | "error";

const STATUS_LABEL: Record<Status, string> = {
    idle: "",
    running: "Analyzing image…",
    done: "Saved.",
    error: "Failed."
};

/**
 * Test-bed for HTTP response streaming: re-runs AI enrichment for the open file and renders the
 * model's output as it arrives, rather than waiting for the whole response.
 *
 * The list cache and the success toast are NOT handled here — the api side also pushes the
 * `fm.file.enrichment` websocket message on completion, which `AiImageEnrichmentEventHandler`
 * already reacts to. This component only shows the live progress.
 */
export const ReenrichWithAi = () => {
    const { file } = useFile();
    const { reenrichFile } = useFeature(AiEnrichmentFeature);

    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<Status>("idle");
    const [tags, setTags] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    // Abort an in-flight stream if the drawer/component goes away, so the read loop doesn't keep
    // running against an unmounted component.
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const start = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setOpen(true);
        setStatus("running");
        setTags([]);
        setDescription("");
        setError(null);

        try {
            for await (const event of reenrichFile.execute(file.id, {
                signal: controller.signal
            })) {
                if (event.type === "partial") {
                    setTags(event.tags);
                    setDescription(event.description);
                } else if (event.type === "done") {
                    setTags(event.tags);
                    setDescription(event.description);
                    setStatus("done");
                } else if (event.type === "error") {
                    setError(event.message);
                    setStatus("error");
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                return;
            }
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
        }
    }, [file.id, reenrichFile]);

    const onOpenChange = useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            abortRef.current?.abort();
        }
        setOpen(nextOpen);
    }, []);

    return (
        <>
            <FileDetails.Action.Button
                label={"Re-enrich with AI"}
                icon={<AiIcon />}
                onAction={start}
                data-testid={"fm.file-details.action.reenrich-with-ai"}
            />
            <Dialog
                open={open}
                onOpenChange={onOpenChange}
                title={"Re-enrich with AI"}
                description={error ?? STATUS_LABEL[status]}
            >
                <div className={"flex flex-col gap-md"}>
                    <div>
                        <div className={"text-sm font-semibold mb-xs"}>{"Tags"}</div>
                        {tags.length ? (
                            <div className={"flex flex-wrap gap-xs"}>
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        className={"text-sm px-sm py-xxs rounded bg-neutral-dimmed"}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className={"text-sm text-neutral-strong"}>{"—"}</div>
                        )}
                    </div>
                    <div>
                        <div className={"text-sm font-semibold mb-xs"}>{"Description"}</div>
                        <div className={"text-sm"}>{description || "—"}</div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};
