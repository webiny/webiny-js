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

/**
 * Which gated route serves the image.
 *
 * `extraction` is the pipeline's own derived images. `composed` is a screenshot of a migrated page,
 * which a separate route serves because it is stored by a separate package with its own allowlist —
 * two routes, one set of rules about who may read them. The caller names the source rather than the
 * URL so both stay in one place.
 */
export type RunImageSource = "extraction" | "composed";

const ROUTE: Record<RunImageSource, string> = {
    extraction: "component-extraction",
    composed: "page-composition-poc"
};

const loadObjectUrl = async (
    apiUrl: string,
    token: string,
    runId: string,
    ref: string,
    source: RunImageSource
): Promise<string> => {
    const base = apiUrl.replace(/\/+$/, "");
    const url = `${base}/_webiny/${ROUTE[source]}/run/${encodeURIComponent(runId)}/image?ref=${encodeURIComponent(ref)}`;
    const existing = cache.get(url);
    if (existing) {
        return existing;
    }
    const promise = (async () => {
        let response: Response;
        try {
            response = await fetch(
                url,
                token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            );
        } catch {
            /*
             * The request never completed, so there is no status to report and claiming one would be
             * wrong. This is what the oversized-response failure looked like from the browser: the
             * platform replaced the response with an error carrying no CORS headers, so the fetch was
             * blocked before any status could be read, and the only honest thing to say is that the
             * request did not complete.
             */
            throw new Error("The request did not complete — no response could be read.");
        }

        if (!response.ok) {
            throw new Error(`The image request failed (${response.status}).`);
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

export function useRunImage(
    runId: string,
    imageRef: string | null | undefined,
    source: RunImageSource = "extraction"
): RunImageState {
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
                const src = await loadObjectUrl(apiUrl, token, runId, imageRef, source);
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
    }, [container, runId, imageRef, source]);

    return state;
}
