import React from "react";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { Cell, Grid } from "@webiny/ui/Grid";
import { PbEditorPageElementAdvancedSettingsPlugin } from "@webiny/app-page-builder/types";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";
import {
    ButtonContainer,
    classes,
    SimpleButton
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";

export default {
    name: "pb-editor-page-element-advanced-settings-iframe",
    type: "pb-editor-page-element-advanced-settings",
    elementType: "iframe",
    render({ Bind, submit }) {
        return (
            <Accordion title={"IFrame"} defaultValue={true}>
                <React.Fragment>
                    <Bind name={"iframe.url"} validators={validation.create("required,url")}>
                        <Input label={"URL"} description={"Enter an iFrame URL"} />
                    </Bind>
                    <Grid className={classes.simpleGrid}>
                        <Cell span={12}>
                            {/*  @ts-ignore */}
                            <ButtonContainer>
                                {/*  @ts-ignore */}
                                <SimpleButton onClick={submit}>Save</SimpleButton>
                            </ButtonContainer>
                        </Cell>
                    </Grid>
                </React.Fragment>
            </Accordion>
        );
    }
} as PbEditorPageElementAdvancedSettingsPlugin;
