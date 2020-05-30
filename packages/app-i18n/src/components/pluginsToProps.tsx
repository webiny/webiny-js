import * as React from "react";

const defaultRenderElement = ({ attributes, children }) => {
    return <p {...attributes}>{children}</p>;
};

const defaultRenderLeaf = ({ attributes, children }) => {
    return <span {...attributes}>{children}</span>;
};

const defaultRenderEditor = ({ children }) => children;

export const pluginsToProps = (plugins, args) => {
    const editorPlugins = plugins.map(pl => pl.editor).filter(Boolean);
    const renderElementFns = [];
    const renderLeafFns = [];
    const renderEditorFns = [];
    const otherProps = {};

    for (let i = 0; i < editorPlugins.length; i++) {
        const { renderEditor, renderElement, renderLeaf, ...other } = editorPlugins[i];

        if (typeof renderEditor === "function") {
            renderEditorFns.push(renderEditor);
        }

        if (typeof renderElement === "function") {
            renderElementFns.push(renderElement);
        }

        if (typeof renderLeaf === "function") {
            renderLeafFns.push(renderLeaf);
        }

        Object.keys(other).forEach(key => {
            if (!otherProps[key]) {
                otherProps[key] = [];
            }
            otherProps[key].push(other[key]);
        });
    }

    renderEditorFns.push(defaultRenderEditor);
    renderElementFns.push(defaultRenderElement);
    renderLeafFns.push(defaultRenderLeaf);

    const renderEditorMw = createMiddleware(renderEditorFns);

    return {
        renderEditor: children => renderEditorMw({ children, ...args }),
        renderElement: createMiddleware(renderElementFns),
        renderLeaf: createLeafMiddleware(renderLeafFns),
        ...Object.keys(otherProps).reduce((acc, key) => {
            const mw = createMiddleware(otherProps[key]);
            acc[key] = event => mw({ event, ...args });
            return acc;
        }, {})
    };
};

const createMiddleware = fns => {
    return args => {
        let i = 0;

        function next() {
            const fn = fns[i++];
            if (!fn) {
                return;
            }

            return fn(args, next);
        }

        return next();
    };
};

const createLeafMiddleware = fns => {
    return args => {
        let i = 0;

        function next({ children }) {
            const fn = fns[i++];
            if (!fn) {
                return children;
            }

            return next({ children: fn({ ...args, children }) });
        }

        return next(args);
    };
};
