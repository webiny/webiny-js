import React, { useState } from "react";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import EmptyCell from "~/editor/plugins/elements/cell/EmptyCell";

const AccordionItemHeader = styled.div<{ isOpen: boolean }>`
    position: relative;
    cursor: pointer;
    padding: 22px 10px;

    .accordion-item-title {
        font-size: 20px;
        font-weight: 700;
        padding-right: 24px;
        color: ${props => (props.isOpen ? "var(--mdc-theme-primary)" : "")};
    }

    .accordion-item-arrow-icon {
        -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOC4xMiA5LjI5IDEyIDEzLjE3bDMuODgtMy44OGEuOTk2Ljk5NiAwIDEgMSAxLjQxIDEuNDFsLTQuNTkgNC41OWEuOTk2Ljk5NiAwIDAgMS0xLjQxIDBMNi43IDEwLjdhLjk5Ni45OTYgMCAwIDEgMC0xLjQxYy4zOS0uMzggMS4wMy0uMzkgMS40MiAweiIvPjwvc3ZnPg==");
        mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOC4xMiA5LjI5IDEyIDEzLjE3bDMuODgtMy44OGEuOTk2Ljk5NiAwIDEgMSAxLjQxIDEuNDFsLTQuNTkgNC41OWEuOTk2Ljk5NiAwIDAgMS0xLjQxIDBMNi43IDEwLjdhLjk5Ni45OTYgMCAwIDEgMC0xLjQxYy4zOS0uMzggMS4wMy0uMzkgMS40MiAweiIvPjwvc3ZnPg==");
        background-color: ${props =>
            props.isOpen
                ? "var(--mdc-theme-primary)"
                : "var(--mdc-theme-text-secondary-on-background)"};
        position: absolute;
        width: 24px;
        height: 24px;
        top: 22px;
        right: 4px;
        transform: ${props => (props.isOpen ? "rotate(-180deg)" : "")};
        transition: transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1),
            -webkit-transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1);
    }
`;

const AccordionItemContent = styled.div<{ isOpen: boolean }>`
    padding-top: 16px;
    margin-top: -16px;
    overflow: hidden;
    height: auto;
    max-height: ${props => (props.isOpen ? "9999px" : 0)};
    transition: ${props =>
        props.isOpen
            ? "max-height 0.3s cubic-bezier(1,0,1,0)"
            : "max-height 0.35s cubic-bezier(0,1,0,1)"};
`;

const PeAccordionItem = createRenderer(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();
        const [isOpen, setIsOpen] = useState(true);

        const elementWithChildren = useRecoilValue(
            elementWithChildrenByIdSelector(element.id)
        ) as Element;

        const childrenElements = elementWithChildren?.elements;
        return (
            <>
                <AccordionItemHeader
                    isOpen={isOpen}
                    onClick={() => {
                        setIsOpen(!isOpen);
                    }}
                >
                    <span className={"accordion-item-title"}>
                        {element.data?.settings?.accordionItem?.title || ""}
                    </span>
                    <div className={"accordion-item-arrow-icon"}></div>
                </AccordionItemHeader>
                <AccordionItemContent isOpen={isOpen}>
                    {Array.isArray(childrenElements) && childrenElements.length > 0 ? (
                        <Elements element={elementWithChildren} />
                    ) : (
                        <EmptyCell element={element} />
                    )}
                </AccordionItemContent>
            </>
        );
    },
    {
        baseStyles: {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderBottom: "2px solid var(--mdc-theme-on-background)"
        }
    }
);

export default PeAccordionItem;
