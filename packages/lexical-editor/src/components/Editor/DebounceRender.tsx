import React from "react";
import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce.js";
import { useLexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig.js";

interface Props {
    children?: React.ReactNode;
}

export const DebounceRenderer = ({ children }: Props) => {
    const [render, setRender] = useState(false);
    const editorConfig = useLexicalEditorConfig();

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
    }, [editorConfig]);

    return <>{render ? children : null}</>;
};
