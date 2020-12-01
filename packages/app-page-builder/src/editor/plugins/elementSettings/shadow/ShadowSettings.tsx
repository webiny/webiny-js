import React from "react";
import { css } from "emotion";
import get from "lodash/get";
import { useRecoilValue } from "recoil";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { BaseColorPickerComponent } from "../components/ColorPicker";
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

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
                <Grid className={classes.gridClass}>
                    <Cell span={6}>
                        <Typography use={"subtitle2"}>Color</Typography>
                    </Cell>
                    <Cell span={6}>
                        <BaseColorPickerComponent
                            label={"Color"}
                            valueKey={DATA_NAMESPACE + ".color"}
                            updateValue={getUpdateValue("color")}
                            updatePreview={getUpdatePreview("color")}
                        />
                    </Cell>
                </Grid>
                <Wrapper
                    containerClassName={classes.gridClass}
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
                    containerClassName={classes.gridClass}
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
                    containerClassName={classes.gridClass}
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
                    containerClassName={classes.gridClass}
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
