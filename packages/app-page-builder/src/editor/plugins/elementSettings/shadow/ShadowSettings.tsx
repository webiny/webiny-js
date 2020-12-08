import React from "react";
import get from "lodash/get";
import { useRecoilValue } from "recoil";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { BaseColorPickerComponent } from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import Accordion from "../components/Accordion";

const DATA_NAMESPACE = "data.settings.shadow";

const Settings: React.FunctionComponent = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    return (
        <Accordion title={"Shadow"}>
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Color"} containerClassName={classes.simpleGrid}>
                    <BaseColorPickerComponent
                        label={"Color"}
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
