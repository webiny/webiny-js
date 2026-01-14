import React from "react";
import { Grid, Input, Textarea, Tags } from "@webiny/admin-ui";
import { validation } from "@webiny/validation";
import type { BindComponent } from "@webiny/form";
import GroupSelect from "./GroupSelect.js";
import { IconPicker } from "~/admin/components/IconPicker.js";

interface GeneralSettingsProps {
    Bind: BindComponent;
}

const GeneralSettings = ({ Bind }: GeneralSettingsProps) => {
    return (
        <React.Fragment>
            <Grid>
                <Grid.Column span={12}>
                    <Bind name={"name"}>
                        <Input label={"Content model name"} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"modelId"}>
                        <Input disabled={true} label={"Content model ID"} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"singularApiName"}>
                        <Input disabled={true} label={"Singular API Name"} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"pluralApiName"}>
                        <Input disabled={true} label={"Plural API Name"} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"description"}>
                        <Textarea rows={5} label={"Content model description"} />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"group"} validators={validation.create("required")}>
                        <GroupSelect />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name="icon">
                        <IconPicker
                            label={`Icon`}
                            description={`Choose an icon to represent the model.`}
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind name={"tags"}>
                        <Tags label={"Tags"} protectedValues={["type:model"]} />
                    </Bind>
                </Grid.Column>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
