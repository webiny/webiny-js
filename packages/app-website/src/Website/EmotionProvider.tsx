import React from "react";
import { CacheProvider, Global, css } from "@emotion/react";
import createCache from "@emotion/cache";

// As stated in https://emotion.sh/docs/ssr#puppeteer:
// "If you are using Puppeteer to prerender your application, emotion's
// speedy option has to be disabled so that the CSS is rendered into the DOM."
export const createEmotionCache = () => {
    return createCache({
        key: "wby",
        speedy: false
    });
};

const bodyContainerStyles = css`
    /* The usage of containers (the "@container" CSS at-rule) enables us to have responsive */
    /* design not only on the actual website, but also within the Page Builder's page editor. */
    /* Note that in the editor, the container is not assigned to the page body, but to the */
    /* editor canvas. See packages/app-page-builder/src/editor/components/Editor/Content.tsx. */

    body {
        container-type: inline-size;
        container-name: body;
    }
`;

export const EmotionProvider: React.FC = ({ children }) => {
    const emotionCache = createEmotionCache();

    return (
        <CacheProvider value={emotionCache}>
            <Global styles={bodyContainerStyles} />
            {children}
        </CacheProvider>
    );
};
