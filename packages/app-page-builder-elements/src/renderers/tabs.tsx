import React, { useState } from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { usePageElements } from "~/hooks/usePageElements";

export type TabsRenderer = ReturnType<typeof createTabs>;

export const createTabs = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();
        const { theme } = usePageElements();
        const [selectedTabElement, setSelectedTabElement] = useState(element.elements[0]);

        theme.styles.elements["tabs"] = {
            ".tabs-header": {
                display: "flex",
                flexWrap: "wrap",
                borderBottom: "2px solid rgba(212, 212, 212, 0.5)"
            },
            ".tab-label": {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexGrow: 1,
                padding: "6px 16px",
                borderBottom: "2px solid transparent",
                backgroundColor: "white",
                cursor: "pointer",
                ...theme.styles.typography.heading6,
                fontSize: "14px",
                transition: "all .2s",

                "&.active": {
                    borderBottom: `2px solid ${theme.styles.colors.color1}`,
                    backgroundColor: "rgba(212, 212, 212, 0.5)"
                },

                "&:hover": {
                    backgroundColor: "rgba(212, 212, 212, 0.5)"
                }
            }
        };

        return (
            <>
                <div className="tabs-header">
                    {element.elements.map((tab, index) => (
                        <div
                            className={`tab-label ${
                                tab.id === selectedTabElement.id ? "active" : ""
                            }`}
                            key={index}
                            onClick={() => {
                                setSelectedTabElement(tab);
                            }}
                        >
                            {tab.data?.settings?.tab?.label || ""}
                        </div>
                    ))}
                </div>
                <Elements element={{ ...element, elements: [selectedTabElement] }} />
            </>
        );
    });
};
