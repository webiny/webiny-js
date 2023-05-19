import React, { useState } from "react";
import styled from "@emotion/styled";
import { ReactComponent as DownArrowIcon } from "@material-symbols/svg-400/outlined/expand_circle_down.svg";

const AccordionWrapper = styled.div<{ isSelected: boolean }>`
    padding: 0 8px 0 8px;
    background-color: white;
    border: 1px solid
        var(${props => (props.isSelected ? "--mdc-theme-primary" : "--mdc-theme-on-background")});
    color: var(--mdc-theme-text-secondary-on-background);
    fill: var(--mdc-theme-text-secondary-on-background);
`;

const AccordionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    padding-bottom: 12px;
`;

const Title = styled.div<{ isSelected: boolean; isOpen: boolean }>`
    display: flex;
    gap: 10px;
    align-items: center;
    color: var(
        ${props =>
            props.isSelected ? "--mdc-theme-primary" : "--mdc-theme-text-secondary-on-background"}
    );
    font-weight: bold;

    & svg {
        cursor: pointer;
        transform: ${props => (props.isOpen ? "" : "rotate(-90deg)")};
        transition: transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1),
            -webkit-transform 0.35s cubic-bezier(0.65, 0.05, 0.36, 1);
    }
`;

const Actions = styled.div`
    display: flex;
    gap: 10px;
    padding-right: 8px;

    & svg {
        cursor: pointer;
    }
`;

const AccordionContent = styled.div<{ isOpen: boolean }>`
    overflow: hidden;
    height: auto;
    max-height: ${props => (props.isOpen ? "9999px" : 0)};
    transition: ${props =>
        props.isOpen
            ? "max-height 0.3s cubic-bezier(1,0,1,0)"
            : "max-height 0.35s cubic-bezier(0,1,0,1)"};

    & > div {
        display: grid;
        row-gap: 11px;
        padding-bottom: 8px;
    }
`;

type AccordionProps = {
    label: string;
    isSelected?: boolean;
    actions: React.ReactNode;
    children: React.ReactNode;
};

export const Accordion: React.FC<AccordionProps> = ({ label, isSelected, actions, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <AccordionWrapper isSelected={Boolean(isSelected)}>
            <AccordionHeader>
                <Title isSelected={Boolean(isSelected)} isOpen={isOpen}>
                    <DownArrowIcon width={16} height={16} onClick={() => setIsOpen(!isOpen)} />
                    {label}
                </Title>
                <Actions>{actions}</Actions>
            </AccordionHeader>
            <AccordionContent isOpen={isOpen}>
                <div>{children}</div>
            </AccordionContent>
        </AccordionWrapper>
    );
};
