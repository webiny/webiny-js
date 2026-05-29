import React from "react";
import { Grid, Input, Select, Switch } from "@webiny/admin-ui";
import { validation } from "@webiny/validation";
import { Bind } from "@webiny/form";

export const RedirectForm = () => {
    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name={"redirectFrom"} validators={[validation.create("required")]}>
                    <Input label={"Redirect From"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"redirectTo"} validators={[validation.create("required")]}>
                    <Input label={"Redirect To"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind
                    name={"redirectType"}
                    validators={[validation.create("required")]}
                    defaultValue={"permanent"}
                >
                    <Select
                        displayResetAction={false}
                        label={"Redirect Type"}
                        options={[
                            {
                                value: "permanent",
                                label: "Permanent"
                            },
                            {
                                value: "temporary",
                                label: "Temporary"
                            }
                        ]}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"isEnabled"}>
                    <Switch label={"Is Enabled?"} />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};
