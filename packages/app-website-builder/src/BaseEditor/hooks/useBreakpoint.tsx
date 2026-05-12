import { useCallback, useMemo } from "react";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { BASE_BREAKPOINT } from "~/constants.js";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/index.js";

export const useBreakpoint = () => {
    const { theme } = useWebsiteBuilderTheme();
    const breakpoints = theme?.breakpoints ?? [];

    const editor = useDocumentEditor();
    const activeBreakpoint = useSelectFromEditor<string>(state => {
        return state.breakpoint ?? breakpoints[0]?.name ?? "desktop";
    });

    const breakpoint = useMemo(() => {
        const bp = breakpoints.find(bp => bp.name === activeBreakpoint);
        return (
            bp ?? {
                name: BASE_BREAKPOINT,
                title: "Base Breakpoint",
                description: "",
                icon: "",
                minWidth: 0,
                maxWidth: 4000
            }
        );
    }, [activeBreakpoint, breakpoints.length]);

    const setBreakpoint = useCallback(
        (mode: string) => {
            editor.updateEditor(state => {
                state.breakpoint = mode;
            });
        },
        [editor]
    );

    return {
        isBaseBreakpoint: breakpoint.name === BASE_BREAKPOINT,
        breakpoint,
        breakpoints,
        setBreakpoint
    };
};
