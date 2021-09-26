import React from "react";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { PbEditorPageElementAdvancedSettingsPlugin } from "@webiny/app-page-builder/types";
import {
    ButtonContainer,
    classes,
    SimpleButton
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";

export default {
    name: "pb-editor-page-element-advanced-settings-space-x",
    type: "pb-editor-page-element-advanced-settings",
    elementType: "spaceX",
    render({ Bind, submit }) {
        return (
            <Accordion title={"GraphQL Query - Variables"} defaultValue={true}>
                <React.Fragment>
                    <Bind
                        name={"initialGqlQueryVariables.limit"}
                        validators={validation.create("required,gte:0,lte:1000")}
                    >
                        <Input
                            label={"Limit"}
                            type="number"
                            description={"Number of records to be returned."}
                        />
                    </Bind>
                    <Bind
                        name={"initialGqlQueryVariables.offset"}
                        validators={validation.create("required,gte:0,lte:1000")}
                    >
                        <Input
                            label={"Offset"}
                            type="number"
                            description={"Amount of records to be skipped."}
                        />
                    </Bind>

                    <Bind name={"initialGqlQueryVariables.type"}>
                        <Select
                            label={"Type"}
                            description={"Chose the record type you want to query."}
                        >
                            <option value="rockets">Rockets</option>
                            <option value="dragons">Dragons</option>
                        </Select>
                    </Bind>

                    <Grid className={classes.simpleGrid}>
                        <Cell span={12}>
                            <ButtonContainer>
                                <SimpleButton onClick={submit}>Save</SimpleButton>
                            </ButtonContainer>
                        </Cell>
                    </Grid>
                </React.Fragment>
            </Accordion>
        );
    }
} as PbEditorPageElementAdvancedSettingsPlugin;
