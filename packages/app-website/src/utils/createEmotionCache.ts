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
