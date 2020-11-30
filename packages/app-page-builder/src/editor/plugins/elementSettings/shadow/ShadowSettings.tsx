import React from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { AccordionItem } from "@webiny/ui/Accordion";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import Input from "../components/Input";
import { BaseColorPickerComponent } from "../components/ColorPicker";
import { ContentWrapper } from "../components/StyledComponents";
// Icon
import { ReactComponent as ShadowIcon } from "@webiny/app-page-builder/editor/assets/icons/layers.svg";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    inputWrapper: css({
        "& .mdc-text-field": {
            width: "100% !important",
            margin: "0px !important"
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
        <AccordionItem
            icon={<ShadowIcon />}
            title={"Shadow"}
            description={"Edit `box-shadow` property"}
        >
            <ContentWrapper direction={"column"}>
                <Grid className={classes.gridClass}>
                    <Cell span={6}>
                        <Typography use={"overline"}>Color</Typography>
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
                <Input
                    containerClassName={classes.gridClass}
                    className={classes.inputWrapper}
                    label={"Horizontal offset"}
                    valueKey={DATA_NAMESPACE + ".horizontal"}
                    updateValue={getUpdateValue("horizontal")}
                />

                <Input
                    containerClassName={classes.gridClass}
                    className={classes.inputWrapper}
                    label={"Vertical offset"}
                    valueKey={DATA_NAMESPACE + ".vertical"}
                    updateValue={getUpdateValue("vertical")}
                />

                <Input
                    containerClassName={classes.gridClass}
                    className={classes.inputWrapper}
                    label={"Blur"}
                    valueKey={DATA_NAMESPACE + ".blur"}
                    updateValue={getUpdateValue("blur")}
                />

                <Input
                    containerClassName={classes.gridClass}
                    className={classes.inputWrapper}
                    label={"Spread"}
                    valueKey={DATA_NAMESPACE + ".spread"}
                    updateValue={getUpdateValue("spread")}
                />
            </ContentWrapper>
        </AccordionItem>
    );
};

export default React.memo(Settings);
