import React from "react";
import get from "lodash/get";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
import { Checkbox } from "@webiny/ui/Checkbox";
import styled from "@emotion/styled";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import useUpdateHandlers from "~/editor/plugins/elementSettings/useUpdateHandlers";
import Wrapper from "~/editor/plugins/elementSettings/components/Wrapper";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import {
    ContentWrapper,
    classes
} from "~/editor/plugins/elementSettings/components/StyledComponents";

const NAMESPACE = "data.settings.carousel";

const CheckboxWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    padding-bottom: 10px;
    height: 20px;
    position: relative;
    top: -8px;
`;

const CarouselStylesSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const [element] = useActiveElement<PbEditorElement>();

    const { getUpdateValue: getUpdateUniversal } = useUpdateHandlers({
        element,
        dataNamespace: NAMESPACE
    });

    return (
        <Accordion title={"Slider Styles"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Wrapper
                    label={"Carousel Arrows"}
                    leftCellSpan={6}
                    rightCellSpan={6}
                    containerClassName={classes.simpleGrid}
                >
                    <CheckboxWrapper>
                        <Checkbox
                            value={get(element, NAMESPACE + ".arrowsToggle", "")}
                            onChange={getUpdateUniversal("arrowsToggle")}
                        />
                    </CheckboxWrapper>
                </Wrapper>
                <Wrapper
                    label={"Carousel Bullets"}
                    leftCellSpan={7}
                    rightCellSpan={5}
                    containerClassName={classes.simpleGrid}
                >
                    <CheckboxWrapper>
                        <Checkbox
                            value={get(element, NAMESPACE + ".bulletsToggle", "")}
                            onChange={getUpdateUniversal("bulletsToggle")}
                        />
                    </CheckboxWrapper>
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(CarouselStylesSettings);
