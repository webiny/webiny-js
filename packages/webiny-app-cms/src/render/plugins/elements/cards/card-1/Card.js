//@flow
import React from "react";
import styled from "react-emotion";
import Element from "webiny-app-cms/render/components/Element";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const CardContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    padding: 10
});

const Card = ({ element }: ElementType) => {
    return (
        <CardContainer>
            <ElementStyle element={element} style={{ height: "100%" }}>
                {element.elements.map(element => (
                    <Element element={element} key={element.id} />
                ))}
            </ElementStyle>
        </CardContainer>
    );
};

export default Card;
