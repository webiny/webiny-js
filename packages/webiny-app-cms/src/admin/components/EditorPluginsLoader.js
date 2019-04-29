import React, { useEffect, useReducer } from "react";
import { registerPlugins } from "webiny-plugins";
import { CircularProgress } from "webiny-ui/Progress";

const globalState = { render: false, editor: false };

export default function EditorPluginsLoader({ children, location }) {
    const [loaded, setLoaded] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        globalState
    );

    async function loadPlugins() {
        // If we are on pages list route, import plugins required to render the page content.
        if (location.pathname.startsWith("/cms/pages") && !loaded.render) {
            const renderPlugins = await import("webiny-app-cms/render/presets/default");
            registerPlugins(renderPlugins.default);

            globalState.render = true;
            setLoaded({ render: true });
        }

        // If we are on the Editor route, import plugins required to render both editor and preview.
        if (location.pathname.startsWith("/cms/editor") && !loaded.editor) {
            const plugins = await Promise.all(
                [
                    import("webiny-app-cms/editor/presets/default"),
                    !loaded.render ? import("webiny-app-cms/render/presets/default") : null
                ].filter(Boolean)
            );
            registerPlugins(plugins.map(p => p.default));

            globalState.editor = true;
            globalState.render = true;

            setLoaded({ editor: true, render: true });
        }
    }

    useEffect(() => {
        loadPlugins();
    }, []);

    if (location.pathname.startsWith("/cms/pages") && loaded.render) {
        return children;
    }

    if (location.pathname.startsWith("/cms/editor") && loaded.editor) {
        return children;
    }

    return <CircularProgress />;
}
