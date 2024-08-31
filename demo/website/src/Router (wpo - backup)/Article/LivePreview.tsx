import React, { useEffect, useState } from "react";
import { ReadonlyArticle } from "@demo/shared";
import { Article } from "./Article";
import { useLivePreview } from "./useLivePreview";

export const LivePreview = () => {
    const [article, setArticle] = useState<ReadonlyArticle | undefined>(undefined);
    useLivePreview({
        onArticle: article => {
            setArticle(article);
        }
    });

    useEffect(() => {
        console.log("Website Live Preview is Ready!");
        parent.postMessage("livePreviewReady", "*");
    }, []);

    if (!article) {
        return null;
    }

    return <Article article={article} />;
};
