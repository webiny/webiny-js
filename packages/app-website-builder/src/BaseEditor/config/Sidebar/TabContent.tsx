import React, { useLayoutEffect, useRef, useState } from "react";
import styled from "@emotion/styled";

export const TabContainer = styled("div")({
    display: "flex",
    position: "relative",
    flexDirection: "column",
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 8
    },
    "&::-webkit-scrollbar-track": {
        background: "transparent"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "var(--color-neutral-strong)",
        opacity: 0.7,
        borderRadius: 9999
    }
});

export interface TabContentProps {
    element: React.JSX.Element;
}

export const TabContent = ({ element }: TabContentProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState<string>();

    // Cap the scroll area to the space between its own top edge and the bottom of the viewport.
    // Measuring the container's actual position means we don't have to know (or guess) what
    // chrome is stacked above it — only the header sits above the sidebar, whereas the shared
    // "reserved UI space" also counts the canvas's address bar/breadcrumbs, which are beside the
    // sidebar, not above it. max-height lets it hug short content (no gap) and scroll when tall.
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const update = () => {
            setMaxHeight(`${window.innerHeight - el.getBoundingClientRect().top}px`);
        };

        // ResizeObserver also fires when the tab becomes visible (display none -> block).
        const observer = new ResizeObserver(update);
        observer.observe(el);
        window.addEventListener("resize", update);
        update();

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, []);

    return (
        <TabContainer ref={ref} style={{ maxHeight }}>
            {element}
        </TabContainer>
    );
};
