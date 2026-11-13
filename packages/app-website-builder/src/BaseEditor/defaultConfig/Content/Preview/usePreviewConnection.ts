import { useCallback, useEffect, useMemo, useState } from "react";
import { Commands } from "~/BaseEditor/index.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";

/**
 * `connecting` - the preview was just (re)loaded, and we're still waiting for the handshake.
 * `connected` - the frontend sent `preview.ready`, which means the editor can talk to it.
 * `unreachable` - nothing is listening on the preview domain, usually because no frontend is running.
 * `unresponsive` - something is listening, but it never sent `preview.ready`, which means it's not a
 * Webiny frontend, or the Website Builder SDK is not set up in it.
 */
export type PreviewConnectionStatus = "connecting" | "connected" | "unreachable" | "unresponsive";

export type PreviewConnectionError = Extract<
    PreviewConnectionStatus,
    "unreachable" | "unresponsive"
>;

// How long we wait for the frontend's `preview.ready` message. This has to be generous, because a
// dev server that was just started compiles the page on the first request.
const HANDSHAKE_TIMEOUT_MS = 15000;

// How often an unreachable preview domain is re-checked, so that starting a dev server while the
// editor is open reloads the preview on its own.
const REACHABILITY_CHECK_INTERVAL_MS = 4000;

/**
 * Checks whether anything is listening on the given origin. The response is opaque (`no-cors`),
 * which is all we need: we only care about whether the browser managed to open a connection.
 * A refused connection rejects almost immediately, which is what makes this a useful early signal.
 */
const isReachable = async (origin: string) => {
    try {
        await fetch(origin, { method: "HEAD", mode: "no-cors", cache: "no-store" });
        return true;
    } catch {
        return false;
    }
};

interface UsePreviewConnectionParams {
    // The full preview URL. Only its origin is used for reachability checks.
    url: string;
    // Whether the frontend has completed the handshake with the editor.
    connected: boolean;
}

interface UsePreviewConnectionResult {
    status: PreviewConnectionStatus;
    retry: () => void;
}

/**
 * Tells us whether the editor is actually talking to a frontend, and if not, why not.
 *
 * There are two signals at play. The handshake (`preview.ready`) is the authoritative one: it only
 * arrives from a frontend that has the Website Builder SDK set up. The reachability check is there
 * for speed: waiting out the handshake timeout to tell someone that they have no frontend running
 * is a poor first experience, and a refused connection gives us that answer in milliseconds.
 */
export const usePreviewConnection = (
    params: UsePreviewConnectionParams
): UsePreviewConnectionResult => {
    const { url, connected } = params;
    const editor = useDocumentEditor();
    const [status, setStatus] = useState<PreviewConnectionStatus>("connecting");

    const origin = useMemo(() => new URL(url).origin, [url]);

    const retry = useCallback(() => {
        editor.executeCommand(Commands.RefreshPreview);
    }, [editor]);

    useEffect(() => {
        if (connected) {
            setStatus("connected");
            return;
        }

        let disposed = false;

        isReachable(origin).then(reachable => {
            // When the origin is reachable, we keep waiting. Only a missing handshake can tell us
            // that whatever answered isn't a frontend the editor can drive.
            if (!disposed && !reachable) {
                setStatus("unreachable");
            }
        });

        const handshakeTimeout = setTimeout(() => {
            if (!disposed) {
                // `unreachable` describes the problem more accurately, so don't overwrite it.
                setStatus(current => (current === "connecting" ? "unresponsive" : current));
            }
        }, HANDSHAKE_TIMEOUT_MS);

        return () => {
            disposed = true;
            clearTimeout(handshakeTimeout);
        };
    }, [origin, connected]);

    useEffect(() => {
        if (status !== "unreachable") {
            // We only poll while nothing is listening. A domain that answers but doesn't complete
            // the handshake would otherwise reload the preview over and over.
            return;
        }

        let disposed = false;

        const interval = setInterval(async () => {
            const reachable = await isReachable(origin);
            if (!disposed && reachable) {
                // The user started their frontend, so reload the preview for them.
                retry();
            }
        }, REACHABILITY_CHECK_INTERVAL_MS);

        return () => {
            disposed = true;
            clearInterval(interval);
        };
    }, [status, origin, retry]);

    return { status, retry };
};
