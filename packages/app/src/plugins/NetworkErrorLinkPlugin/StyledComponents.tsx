import styled from "@emotion/styled";

export const OverlayWrapper = styled("div")(`
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 105; // The highest z-index value is 100 for Dialogs
    
    .inner {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: white;
        padding: 1rem;
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        .header__title {
            color: var(--mdc-theme-error);
        }
    }
    
    .body {
        flex-grow: 1;
        .body__summary {
            margin-bottom: 1rem;
        }
    }
    
    .footer {
        color: var(--mdc-theme-text-secondary-on-background);
        
        .highlight {
            background-color: rgba(251, 245, 180, 0.5);
            padding: 0 4px;
            border-radius: 6px;
            font-family: monospace;
        }
    }
`);

export const Pre = styled("pre")(`
    position: relative;
    display: block;
    padding: 0.5em;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    overflow-x: auto;
    white-space: pre-wrap;
    border-radius: 0.25rem;
    background-color: rgba(251, 245, 180, 0.3);
    color: inherit;
    
    code {
        font-family: monospace;
        font-size: 0.85rem;
        line-height: 1rem;
    }
`);
