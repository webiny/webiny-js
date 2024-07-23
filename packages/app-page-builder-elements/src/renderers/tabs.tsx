import React, { useState } from "react";
import styled from "@emotion/styled";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { ClassNames } from "@emotion/react";

const TabsHeader = styled.div`
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    border-bottom: 2px solid ${props => props.theme.styles.colors.color5};
`;

const TabLabel = styled.div<{ active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    flex-grow: 1;
    flex-basis: content;
    padding: 6px 16px;
    border-bottom: 2px solid
        ${props => (props.active ? props.theme.styles.colors.color1 : "transparent")};
    background-color: ${props =>
        props.active ? props.theme.styles.colors.color5 : props.theme.styles.colors.color6};
    cursor: pointer;
    ${props => props.theme.styles.typography.headings.stylesById("heading6")};
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
        background-color: ${props => props.theme.styles.colors.color5};
    }
`;

export type TabsRenderer = ReturnType<typeof createTabs>;

export const createTabs = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();
        const [selectedTabElement, setSelectedTabElement] = useState(element.elements[0]);

        return (
            <>
                <TabsHeader>
                    {element.elements.map((tab, index) => {
                        const active = tab.id === selectedTabElement.id;
                        return (
                            <ClassNames key={index}>
                                {({ cx }) => (
                                    <TabLabel
                                        active={active}
                                        className={cx("tab-label", { active })}
                                        onClick={() => {
                                            setSelectedTabElement(tab);
                                        }}
                                    >
                                        {tab.data?.settings?.tab?.label || ""}
                                    </TabLabel>
                                )}
                            </ClassNames>
                        );
                    })}
                </TabsHeader>
                <Elements element={{ ...element, elements: [selectedTabElement] }} />
            </>
        );
    });
};
