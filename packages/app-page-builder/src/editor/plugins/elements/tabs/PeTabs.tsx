import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { Typography } from "@webiny/ui/Typography";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element as ElementType } from "@webiny/app-page-builder-elements/types";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

const TabsContainer = styled.div`
    width: 100%;
`;

const TabsHeader = styled.div`
    display: flex;
    flex-wrap: wrap;
    border-bottom: 2px solid var(--mdc-theme-on-background);
    margin-bottom: 16px;
`;

const TabLabel = styled.div<{ isActive: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    padding: 4px 16px;
    border-bottom: ${props =>
        props.isActive ? "2px solid var(--mdc-theme-primary)" : "2px solid transparent"};
    background-color: ${props => (props.isActive ? "var(--mdc-theme-background)" : "white")};
    transition: all 0.2s;
    cursor: pointer;
    z-index: 40;

    &:hover {
        background-color: var(--mdc-theme-background);
    }

    & > span {
        font-size: 14px;
    }
`;

const PeTabs = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const elementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(element.id)
    ) as ElementType;
    const childrenElements = elementWithChildren?.elements;
    const [selectedTabElement, setSelectedTabElement] = useState(childrenElements[0]);
    const selectedTabElementWithChildren = useRecoilValue(
        elementWithChildrenByIdSelector(selectedTabElement.id)
    ) as ElementType;
    const [, setActiveElementId] = useActiveElementId();

    useEffect(() => {
        setSelectedTabElement(childrenElements[0]);
    }, [childrenElements.length]);

    return (
        <TabsContainer>
            <TabsHeader>
                {childrenElements.map((tab, index) => (
                    <TabLabel
                        key={index}
                        onClick={() => {
                            setSelectedTabElement(tab);
                            setActiveElementId(tab.id);
                        }}
                        isActive={tab.id === selectedTabElement.id}
                    >
                        <Typography use="headline6">
                            {tab.data?.settings?.tab?.label || ""}
                        </Typography>
                    </TabLabel>
                ))}
            </TabsHeader>
            <Elements
                element={{ ...elementWithChildren, elements: [selectedTabElementWithChildren] }}
            />
        </TabsContainer>
    );
});

export default PeTabs;
