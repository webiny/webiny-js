import { ReadonlyArticle } from "@demo/shared";
import { useCallback, useEffect } from "react";

export interface UseLivePreviewParams {
    onArticle: (article: ReadonlyArticle) => void;
}
export function useLivePreview({ onArticle }: UseLivePreviewParams) {
    const onMessage = useCallback(
        event => {
            const article = event.data;
            onArticle(article);
        },
        [onArticle]
    );

    useEffect(() => {
        window.addEventListener("message", onMessage);

        return () => {
            window.removeEventListener("message", onMessage);
        };
    }, [onArticle]);
}
