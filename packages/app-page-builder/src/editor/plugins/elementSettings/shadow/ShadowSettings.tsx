import React from "react";
import get from "lodash/get";
import { useRecoilValue } from "recoil";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";
import useUpdateHandlers from "../useUpdateHandlers";
// Components
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { BaseColorPickerComponent } from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
import { PbEditorElement } from "~/types";

const DATA_NAMESPACE = "data.settings.shadow";

const Settings = () => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as PbEditorElement;
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    return (
        <Accordion title={"Shadow"}>
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Color"} containerClassName={classes.simpleGrid}>
                    <BaseColorPickerComponent
                        // @ts-refactor label does not exist on BaseColorPicker nor are props passed on
                        // label={"Color"}
                        valueKey={DATA_NAMESPACE + ".color"}
                        updateValue={getUpdateValue("color")}
                        updatePreview={getUpdatePreview("color")}
                    />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.simpleGrid}
                    label={"Horizontal offset"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField
                        value={get(element, DATA_NAMESPACE + ".horizontal", 0)}
                        onChange={getUpdateValue("horizontal")}
                    />
                </Wrapper>

                <Wrapper
                    containerClassName={classes.simpleGrid}
                    label={"Vertical offset"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField
                        value={get(element, DATA_NAMESPACE + ".vertical", 0)}
                        onChange={getUpdateValue("vertical")}
                    />
                </Wrapper>

                <Wrapper
                    containerClassName={classes.simpleGrid}
                    label={"Blur"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField
                        value={get(element, DATA_NAMESPACE + ".blur", 0)}
                        onChange={getUpdateValue("blur")}
                    />
                </Wrapper>

                <Wrapper
                    containerClassName={classes.simpleGrid}
                    label={"Spread"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField
                        value={get(element, DATA_NAMESPACE + ".spread", 0)}
                        onChange={getUpdateValue("spread")}
                    />
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(Settings);
