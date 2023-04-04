import React from "react";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as ArrowIcon } from "@material-design-icons/svg/round/keyboard_arrow_up.svg";
import { createRenderer, useRenderer, Elements } from "@webiny/app-page-builder-elements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import EmptyCell from "~/editor/plugins/elements/cell/EmptyCell";

const AccordionItemContainer = styled.div`
    width: 100%;
`;

const AccordionItemTitle = styled.div`
    display: flex;
    justify-content: space-between;
    min-height: 25px;
    padding: 22px 10px;
    color: var(--mdc-theme-primary);

    .title {
        font-size: 20px;
        font-weight: 700;
    }

    & > svg {
        fill: var(--mdc-theme-primary);
        flex-shrink: 0;
    }
`;

const PeAccordionItem = createRenderer(
    () => {
        const { getElement } = useRenderer();
        const element = getElement();

        const elementWithChildren = useRecoilValue(
            elementWithChildrenByIdSelector(element.id)
        ) as Element;

        const childrenElements = elementWithChildren?.elements;
        return (
            <AccordionItemContainer>
                <AccordionItemTitle>
                    <Typography use="body1" className={"title"}>
                        {element.data?.settings?.accordionItem?.title || ""}
                    </Typography>
                    <ArrowIcon />
                </AccordionItemTitle>
                {Array.isArray(childrenElements) && childrenElements.length > 0 ? (
                    <Elements element={elementWithChildren} />
                ) : (
                    <EmptyCell element={element} />
                )}
            </AccordionItemContainer>
        );
    },
    {
        baseStyles: {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "100%",
            borderBottom: "2px solid var(--mdc-theme-on-background)"
        }
    }
);

export default PeAccordionItem;
