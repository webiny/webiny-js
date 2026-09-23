import { useEffect, useState } from "react";
import { useContainer } from "@webiny/app";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { AuthenticationContext } from "@webiny/app-admin/features/security/AuthenticationContext/index.js";

/**
 * Loads a run image from the auth-gated delivery route. A plain `<img src>` can't send the bearer token,
 * so images are fetched with the id token and turned into object URLs. Derived images are immutable
 * (their keys carry the stage version), so each object URL is cached for the session — the same crop
 * shown in several places is fetched once.
 */
const cache = new Map<string, Promise<string>>();

const loadObjectUrl = async (
    apiUrl: string,
    token: string,
    runId: string,
    ref: string
): Promise<string> => {
    const base = apiUrl.replace(/\/+$/, "");
    const url = `${base}/_webiny/component-extraction/run/${encodeURIComponent(runId)}/image?ref=${encodeURIComponent(ref)}`;
    const existing = cache.get(url);
    if (existing) {
        return existing;
    }
    const promise = (async () => {
        const response = await fetch(
            url,
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        if (!response.ok) {
            /*
             * The status is carried through rather than swallowed. A large full-page screenshot can
             * exceed the Lambda response cap and come back 500, and a view that renders nothing for
             * that looks identical to a page with no screenshot at all.
             */
            throw new Error(
                response.status === 500
                    ? "The image could not be delivered (500). It may be too large to return."
                    : `The image request failed (${response.status}).`
            );
        }
        return URL.createObjectURL(await response.blob());
    })();
    // Don't cache a rejection — a token that had expired should be retried on the next mount.
    promise.catch(() => cache.delete(url));
    cache.set(url, promise);
    return promise;
};

export interface RunImageState {
    src: string | null;
    loading: boolean;
    failed: boolean;
    /** Why it failed, for a view that should say so rather than show a gap. */
    error: string | null;
}

export function useRunImage(runId: string, imageRef: string | null | undefined): RunImageState {
    const container = useContainer();
    const [state, setState] = useState<RunImageState>({
        src: null,
        loading: Boolean(imageRef),
        failed: false,
        error: null
    });

    useEffect(() => {
        if (!imageRef) {
            setState({ src: null, loading: false, failed: false, error: null });
            return;
        }
        let cancelled = false;
        setState({ src: null, loading: true, failed: false, error: null });
        (async () => {
            try {
                const apiUrl = container.resolve(EnvConfig).get("apiUrl");
                const token = (await container.resolve(AuthenticationContext).getIdToken()) ?? "";
                const src = await loadObjectUrl(apiUrl, token, runId, imageRef);
                if (!cancelled) {
                    setState({ src, loading: false, failed: false, error: null });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({
                        src: null,
                        loading: false,
                        failed: true,
                        error: (error as Error).message
                    });
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [container, runId, imageRef]);

    return state;
}
