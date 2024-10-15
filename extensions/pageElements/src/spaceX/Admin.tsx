import React, { useEffect } from "react";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import {
    PbEditorPageElementAdvancedSettingsPlugin,
    PbEditorPageElementPlugin
} from "@webiny/app-page-builder/types";

import { SpaceX, SpaceXElementData } from "./SpaceX";

const INITIAL_ELEMENT_DATA: SpaceXElementData = {
    variables: { type: "rockets", limit: "10", offset: "0" }
};
import { plugins } from "@webiny/plugins";

export const Admin = () => {
    useEffect(() => {
        plugins.register([
            // The `PbEditorPageElementPlugin` plugin.
            {
                name: "pb-editor-page-element-space-x",
                type: "pb-editor-page-element",
                elementType: "spaceX",
                render: SpaceX,
                toolbar: {
                    // We use `pb-editor-element-group-media` to put our new
                    // page element into the Media group in the left sidebar.
                    title: "SpaceX",
                    group: "pb-editor-element-group-media",
                    preview() {
                        // We can return any JSX / React code here. To keep it
                        // simple, we are simply returning the element's name.
                        return <>Space X Page Element</>;
                    }
                },

                // Defines which types of element settings are available to the user.
                settings: [
                    "pb-editor-page-element-settings-delete",
                    "pb-editor-page-element-settings-visibility",
                    "pb-editor-page-element-style-settings-padding",
                    "pb-editor-page-element-style-settings-margin",
                    "pb-editor-page-element-style-settings-width",
                    "pb-editor-page-element-style-settings-height",
                    "pb-editor-page-element-style-settings-background"
                ],

                // Defines onto which existing elements our element can be dropped.
                // In most cases, using `["cell", "block"]` will suffice.
                target: ["cell", "block"],
                onCreate: "open-settings",

                // `create` function creates the initial data for the page element.
                create(options) {
                    return {
                        type: "spaceX",
                        elements: [],
                        data: INITIAL_ELEMENT_DATA,
                        ...options
                    };
                }
            } as PbEditorPageElementPlugin,

            // The `PbEditorPageElementAdvancedSettingsPlugin` plugin.
            {
                name: "pb-editor-page-element-advanced-settings-space-x",
                type: "pb-editor-page-element-advanced-settings",
                elementType: "spaceX",
                render({ Bind, submit }) {
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
                }
            } as PbEditorPageElementAdvancedSettingsPlugin
        ]);
    }, []);
    return null;
};
