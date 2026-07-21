// Styles for the embedded (third-party) GraphQL Playground widget. These target DOM rendered
// by the playground library, so they are plain CSS descendant rules injected via a <style> tag
// rather than Tailwind utilities or CSS-in-JS.
const sharedResets = (scope: string) => `
    ${scope} p, ${scope} a, ${scope} h1, ${scope} h2, ${scope} h3, ${scope} h4, ${scope} ul, ${scope} pre, ${scope} code {
        margin: 0;
        padding: 0;
        color: inherit;
    }
    ${scope} a:active, ${scope} a:focus, ${scope} button:focus, ${scope} input:focus {
        outline: none;
    }
    ${scope} input, ${scope} button, ${scope} submit {
        border: none;
    }
    ${scope} input, ${scope} button, ${scope} pre {
        font-family: 'Open Sans', sans-serif;
    }
    ${scope} code {
        font-family: Consolas, monospace;
    }
`;

export const PLAYGROUND_CONTAINER_ID = "graphql-playground";

export const playgroundStyles = `
    #${PLAYGROUND_CONTAINER_ID} {
        margin-top: -3px;
        overflow: hidden;
    }
    #${PLAYGROUND_CONTAINER_ID} .playground {
        height: calc(100vh - 45px);
        margin: 0;
        padding: 0;
        font-family: 'Open Sans', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: rgba(0, 0, 0, .8);
        line-height: 1.5;
        letter-spacing: 0.53px;
        margin-right: -1px !important;
    }
    ${sharedResets(`#${PLAYGROUND_CONTAINER_ID} .playground`)}
    ${sharedResets(".ReactModalPortal")}
`;
