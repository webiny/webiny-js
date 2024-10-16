import React from "react";
import { PbEditorPageElementAdvancedSettingsPlugin, PbEditorPageElementPlugin } from "./_dev";

import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { SpaceX, SpaceXElementData } from "./SpaceX";
import { OnCreateActions } from "@webiny/app-page-builder/types";
import { Element } from "@webiny/app-page-builder-elements/types";
import {PbRenderElementPlugin} from "./_dev";

const INITIAL_ELEMENT_DATA: SpaceXElementData = {
    variables: { type: "rockets", limit: "10", offset: "0" }
};

export const Extension = () => (
    <>
        <PbRenderElementPlugin elementType={"spaceX"} render={SpaceX} />
        <PbEditorPageElementPlugin
            type={"pb-editor-page-element"}
            elementType={"spaceX"}
            render={({element}) => <SpaceX element={element as Element}/>}
            toolbar={{
                // We use `pb-editor-element-group-media` to put our new
                // page element into the Media group in the left sidebar.
                title: "SpaceX",
                group: "pb-editor-element-group-media",
                preview() {
                    // We can return any JSX / React code here. To keep it
                    // simple, we are simply returning the element's name.
                    return <>Space X Page Element</>;
                }
            }}
            // Defines which types of element settings are available to the user.
            settings={[
                "pb-editor-page-element-settings-delete",
                "pb-editor-page-element-settings-visibility",
                "pb-editor-page-element-style-settings-padding",
                "pb-editor-page-element-style-settings-margin",
                "pb-editor-page-element-style-settings-width",
                "pb-editor-page-element-style-settings-height",
                "pb-editor-page-element-style-settings-background"
            ]}
            // Defines onto which existing elements our element can be dropped.
            // In most cases, using `["cell", "block"]` will suffice.
            target={["cell", "block"]}
            onCreate={OnCreateActions.OPEN_SETTINGS}
            // `create` function creates the initial data for the page element.
            create={options => {
                return {
                    type: "spaceX",
                    elements: [],
                    data: INITIAL_ELEMENT_DATA,
                    ...options
                };
            }}
        />
        <PbEditorPageElementAdvancedSettingsPlugin
            elementType={"spaceX"}
            render={({ Bind, submit }) => {
                // In order to construct the settings form, we're using the
                // `@webiny/form`, `@webiny/ui`, and `@webiny/validation` packages.
                return (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"variables.type"}>
                                    <Select
                                        label={"Type"}
                                        description={"Chose the record type you want to query."}
                                    >
                                        <option value="rockets">Rockets</option>
                                        <option value="dragons">Dragons</option>
                                    </Select>
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name={"variables.limit"}
                                    validators={validation.create("required,gte:0,lte:1000")}
                                >
                                    <Input
                                        label={"Limit"}
                                        type="number"
                                        description={"Number of records to be returned."}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name={"variables.offset"}
                                    validators={validation.create("required,gte:0,lte:1000")}
                                >
                                    <Input
                                        label={"Offset"}
                                        type="number"
                                        description={"Amount of records to be skipped."}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                            </Cell>
                        </Grid>
                    </>
                );
            }}
        />
    </>
);
