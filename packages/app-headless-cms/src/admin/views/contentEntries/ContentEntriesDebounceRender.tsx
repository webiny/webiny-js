import React from "react";
import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

interface Props {
    children?: React.ReactNode;
}
/**
 * ContentEntriesDebounceRenderer is a wrapper component that delays the rendering of its children
 * until all necessary configurations are fully loaded.
 *
 * This component uses a debounced render approach to prevent excessive re-renders as configurations
 * like `acoConfigs`, `entryListConfigs`, and `entryEditorConfigs` are loaded. By deferring the
 * initial render until these configurations are ready, we ensure that the children are rendered
 * only when the app's environment is fully configured.
 */
export const ContentEntriesDebounceRenderer = ({ children }: Props) => {
    const [render, setRender] = useState(false);
    const entryListConfigs = useContentEntryListConfig();
    const entryEditorConfigs = useContentEntryListConfig();

    const debouncedRender = useMemo(() => {
        return debounce(() => {
            setRender(true);
        }, 10);
    }, [setRender]);

    useEffect(() => {
        if (render) {
            return;
        }

        debouncedRender();

        return () => {
            debouncedRender.cancel();
        };
    }, [entryListConfigs, entryEditorConfigs]);

    return <>{render ? children : null}</>;
};
