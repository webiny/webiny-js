import React from "react";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as HiddenIcon } from "./icons/round-visibility_off-24px.svg";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-hidden",
    field: {
        type: "hidden",
        name: "hidden",
        label: "Hidden",
        description: "Predefined values, hidden text",
        icon: <HiddenIcon />,
        createField() {
            return {
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: ""
                }
            };
        },
        renderSettings({ form }) {
            const { Bind } = form;
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"settings.defaultValue"}>
                            <Input
                                label={"Default value"}
                                description={"Default value (optional)"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
