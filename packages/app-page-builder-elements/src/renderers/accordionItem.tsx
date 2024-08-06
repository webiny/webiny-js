import React, { useState } from "react";
import styled from "@emotion/styled";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

const arrowIcon =
    'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOC4xMiA5LjI5IDEyIDEzLjE3bDMuODgtMy44OGEuOTk2Ljk5NiAwIDEgMSAxLjQxIDEuNDFsLTQuNTkgNC41OWEuOTk2Ljk5NiAwIDAgMS0xLjQxIDBMNi43IDEwLjdhLjk5Ni45OTYgMCAwIDEgMC0xLjQxYy4zOS0uMzggMS4wMy0uMzkgMS40MiAweiIvPjwvc3ZnPg==")';

const AccordionItem = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-bottom: 2px solid ${props => props.theme.styles.colors.color5};
`;

const AccordionItemHeader = styled.div<{ open?: boolean }>`
    position: relative;
    cursor: pointer;
    padding: 12px 10px 32px 10px;

    .accordion-item-title {
        ${props => props.theme.styles.typography.paragraphs.stylesById("paragraph1")};
        color: ${props =>
            props.open ? props.theme.styles.colors.color1 : props.theme.styles.colors.color3};
        font-size: 20px;
        font-weight: 700;
        padding-right: 24px;
    }

    .accordion-item-arrow-icon {
        -webkit-mask-image: ${arrowIcon};
        mask-image: ${arrowIcon};
        background-color: ${props =>
            props.open ? props.theme.styles.colors.color1 : props.theme.styles.colors.color3};
        position: absolute;
        width: 24px;
        height: 24px;
        top: 12px;
        right: 4px;
        transition:
            transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1),
            -webkit-transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1);
        transform: ${props => (props.open ? "rotate(-180deg)" : "none")};
    }
`;

const AccordionItemContent = styled.div<{ open?: boolean }>`
    overflow: hidden;
    height: auto;
    max-height: ${props => (props.open ? "9999px" : 0)};
    transition: ${props =>
        props.open
            ? "max-height 0.3s cubic-bezier(1,0,1,0)"
            : "max-height 0.35s cubic-bezier(0,1,0,1)"};
`;

export type AccordionItemRenderer = ReturnType<typeof createAccordionItem>;

export const createAccordionItem = () => {
    return createRenderer(() => {
        const { getElement, theme } = useRenderer();
        const element = getElement();
        const [isOpen, setOpen] = useState(
            element?.data?.settings?.accordionItem?.expanded || false
        );

        return (
            <AccordionItem theme={theme}>
                <AccordionItemHeader theme={theme} open={isOpen} onClick={() => setOpen(!isOpen)}>
                    <div className="accordion-item-title">
                        {element.data?.settings?.accordionItem?.title || ""}
                    </div>
                    <div className="accordion-item-arrow-icon"></div>
                </AccordionItemHeader>
                <AccordionItemContent open={isOpen}>
                    <Elements element={element} />
                </AccordionItemContent>
            </AccordionItem>
        );
    });
};
