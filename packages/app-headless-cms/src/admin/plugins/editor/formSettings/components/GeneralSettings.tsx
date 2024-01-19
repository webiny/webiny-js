import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Tags } from "@webiny/ui/Tags";
import { validation } from "@webiny/validation";
import { BindComponent } from "@webiny/form";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import GroupSelect from "./GroupSelect";

interface GeneralSettingsProps {
    Bind: BindComponent;
}

const GeneralSettings = ({ Bind }: GeneralSettingsProps) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"name"}>
                        <Input label={"Content model name"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"modelId"}>
                        <Input disabled={true} label={"Content model ID"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"singularApiName"}>
                        <Input disabled={true} label={"Singular API Name"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"pluralApiName"}>
                        <Input disabled={true} label={"Plural API Name"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"description"}>
                        <Input rows={5} label={"Content model description"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"group"} validators={validation.create("required")}>
                        <GroupSelect />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name="icon">
                        <IconPicker
                            label={`Icon`}
                            description={`Choose an icon to represent the model.`}
                        />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"tags"}>
                        <Tags label={"Tags"} />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
