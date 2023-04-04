import React, { useState } from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { usePageElements } from "~/hooks/usePageElements";

export type AccordionItemRenderer = ReturnType<typeof createAccordionItem>;

export const createAccordionItem = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();
        const { theme } = usePageElements();
        const [isOpen, setOpen] = useState(
            element?.data?.settings?.accordionItem?.expanded || false
        );

        theme.styles.elements["accordion-item"] = {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderBottom: `2px solid ${theme.styles.colors.color5}`,

            ".accordion-item-header": {
                position: "relative",
                cursor: "pointer",
                padding: "22px 10px",

                ".accordion-item-title": {
                    ...theme.styles.typography.paragraph1,
                    fontSize: "20px",
                    fontWeight: 700,
                    paddingRight: "24px"
                },

                ".accordion-item-arrow-icon": {
                    "-webkit-mask-image": `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOC4xMiA5LjI5IDEyIDEzLjE3bDMuODgtMy44OGEuOTk2Ljk5NiAwIDEgMSAxLjQxIDEuNDFsLTQuNTkgNC41OWEuOTk2Ljk5NiAwIDAgMS0xLjQxIDBMNi43IDEwLjdhLjk5Ni45OTYgMCAwIDEgMC0xLjQxYy4zOS0uMzggMS4wMy0uMzkgMS40MiAweiIvPjwvc3ZnPg==")`,
                    maskImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOC4xMiA5LjI5IDEyIDEzLjE3bDMuODgtMy44OGEuOTk2Ljk5NiAwIDEgMSAxLjQxIDEuNDFsLTQuNTkgNC41OWEuOTk2Ljk5NiAwIDAgMS0xLjQxIDBMNi43IDEwLjdhLjk5Ni45OTYgMCAwIDEgMC0xLjQxYy4zOS0uMzggMS4wMy0uMzkgMS40MiAweiIvPjwvc3ZnPg==")`,
                    backgroundColor: theme.styles.colors.color3,
                    position: "absolute",
                    width: "24px",
                    height: "24px",
                    top: "22px",
                    right: "4px",
                    transition:
                        "transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1), -webkit-transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1)"
                },

                "&.open": {
                    ".accordion-item-title": { color: `${theme.styles.colors.color1} !important` },

                    ".accordion-item-arrow-icon": {
                        backgroundColor: `${theme.styles.colors.color1} !important`,
                        transform: "rotate(-180deg)"
                    }
                }
            },

            ".accordion-item-content": {
                overflow: "hidden",
                transition: "max-height 0.3s cubic-bezier(1,0,1,0)",
                height: "auto",
                maxHeight: 9999,

                "&.collapsed": {
                    maxHeight: 0,
                    transition: "max-height 0.35s cubic-bezier(0,1,0,1)"
                }
            }
        };

        return (
            <>
                <div
                    className={`accordion-item-header ${isOpen ? "open" : ""}`}
                    onClick={() => setOpen(!isOpen)}
                >
                    <div className="accordion-item-title">
                        {element.data?.settings?.accordionItem?.title || ""}
                    </div>
                    <div className="accordion-item-arrow-icon"></div>
                </div>
                <div className={`accordion-item-content ${!isOpen ? "collapsed" : ""}`}>
                    <Elements element={element} />
                </div>
            </>
        );
    });
};
