import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element as ElementType } from "@webiny/app-page-builder-elements/types";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { ClassNames } from "@emotion/react";

const TabsContainer = styled.div`
    width: 100%;
`;

const TabsHeader = styled.div`
    display: flex;
    flex-wrap: nowrap;
    border-bottom: 2px solid ${props => props.theme.styles.colors.color5};
    margin-bottom: 16px;
    overflow-x: auto;
`;

const TabLabel = styled.div<{ active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    flex-grow: 1;
    flex-basis: content;
    transition: none;
    padding: 4px 16px;
    border-bottom: 2px solid
        ${props => (props.active ? props.theme.styles.colors.color1 : "transparent")};
    background-color: ${props =>
        props.active ? props.theme.styles.colors.color5 : props.theme.styles.colors.color6};
    cursor: pointer;
    ${props => props.theme.styles.typography.headings.stylesById("heading6")};
    font-size: 14px;
    transition: all 0.2s;
    z-index: 40;

    &:hover {
        background-color: ${props => props.theme.styles.colors.color5};
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
                {childrenElements.map((tab, index) => {
                    const active = tab.id === selectedTabElement.id;
                    return (
                        <ClassNames key={index}>
                            {({ cx }) => (
                                <TabLabel
                                    active={active}
                                    className={cx("tab-label", { active })}
                                    onClick={() => {
                                        setSelectedTabElement(tab);
                                        setActiveElementId(tab.id);
                                    }}
                                >
                                    {tab.data?.settings?.tab?.label || ""}
                                </TabLabel>
                            )}
                        </ClassNames>
                    );
                })}
            </TabsHeader>
            <Elements
                element={{ ...elementWithChildren, elements: [selectedTabElementWithChildren] }}
            />
        </TabsContainer>
    );
});

export default PeTabs;
