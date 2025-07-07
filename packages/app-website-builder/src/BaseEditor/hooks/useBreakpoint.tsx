import React, { useCallback, useMemo } from "react";
import { useDocumentEditor } from "~/DocumentEditor";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor";
import { Breakpoint } from "~/sdk/types";
import { ReactComponent as LaptopIcon } from "@webiny/icons/laptop_mac.svg";
import { ReactComponent as TabletIcon } from "@webiny/icons/tablet_mac.svg";
import { ReactComponent as MobileIcon } from "@webiny/icons/phone_iphone.svg";
import { BASE_BREAKPOINT } from "~/constants";

export type EditorBreakpoint = Breakpoint & {
    title: string;
    description: string;
    icon: React.ReactNode;
};

const BREAKPOINTS: EditorBreakpoint[] = [
    {
        name: "desktop",
        title: "Desktop",
        description: `Desktop styles apply at all breakpoints, unless they're edited at a smaller breakpoint. Start your styling here.`,
        icon: <LaptopIcon />,
        minWidth: 0,
        maxWidth: 4000
    },
    {
        name: "tablet",
        title: "Tablet",
        description: `Styles added here will apply at 991px and down, unless they're edited at a smaller breakpoint.`,
        icon: <TabletIcon />,
        minWidth: 0,
        maxWidth: 991
    },
    {
        name: "mobile",
        title: "Mobile",
        description: `Styles added here will apply at 767px and down.`,
        icon: <MobileIcon />,
        minWidth: 0,
        maxWidth: 767
    }
];

export const useBreakpoint = () => {
    const editor = useDocumentEditor();
    const activeBreakpoint = useSelectFromEditor<string>(state => {
        return state.breakpoint || BREAKPOINTS[0].name;
    });

    const breakpoint = useMemo(() => {
        return BREAKPOINTS.find(bp => bp.name === activeBreakpoint)!;
    }, [activeBreakpoint]);

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
        breakpoints: BREAKPOINTS,
        setBreakpoint
    };
};
