import { useEffect } from "react";
import { useFeature } from "@webiny/app-admin";
import { useWebsockets } from "@webiny/app-websockets";
import { ExtractionFeature } from "~/features/extraction/index.js";
import type { ExtractionUncertainty } from "~/features/extraction/index.js";

/**
 * Subscribes the extraction repository to the progress stream.
 *
 * The action names are duplicated here rather than imported from `@webiny/api-theme-extraction`: this is
 * browser code, and pulling in an API package to read three string constants would drag puppeteer's whole
 * dependency graph into the Admin bundle. They are asserted against the API in a test instead.
 */
export const EXTRACTION_PROGRESS_ACTION = "theme.extraction.progress";
export const EXTRACTION_FAILED_ACTION = "theme.extraction.failed";
export const EXTRACTION_DONE_ACTION = "theme.extraction.done";

/** The socket layer requires `action` on every message shape it delivers. */
interface ProgressMessage {
    action: string;
    data: {
        extractionId: string;
        percent: number;
        message: string;
    };
}

interface FailedMessage {
    action: string;
    data: {
        extractionId: string;
        message: string;
    };
}

interface DoneMessage {
    action: string;
    data: {
        extractionId: string;
        themeId: string;
        summary?: string;
        confidence?: string;
        uncertain?: ExtractionUncertainty[];
    };
}

export const useExtraction = () => {
    const { repository } = useFeature(ExtractionFeature);
    const websockets = useWebsockets();

    useEffect(() => {
        const progress = websockets.onMessage<ProgressMessage>(
            EXTRACTION_PROGRESS_ACTION,
            message => {
                repository.applyProgress(
                    message.data.extractionId,
                    message.data.percent,
                    message.data.message
                );
            }
        );

        const failed = websockets.onMessage<FailedMessage>(EXTRACTION_FAILED_ACTION, message => {
            repository.applyFailure(message.data.extractionId, message.data.message);
        });

        const done = websockets.onMessage<DoneMessage>(EXTRACTION_DONE_ACTION, message => {
            repository.applyDone(message.data.extractionId, {
                themeId: message.data.themeId,
                summary: message.data.summary,
                confidence: message.data.confidence,
                uncertain: message.data.uncertain
            });
        });

        return () => {
            // Unsubscribed on unmount, but the repository is a singleton, so the run itself continues and
            // remounting picks it back up.
            progress.off();
            failed.off();
            done.off();
        };
    }, [repository, websockets]);

    return repository;
};
