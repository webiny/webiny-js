import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { FbBuilderFieldPlugin } from "~/types";
import { Accordion } from "@webiny/ui/Accordion";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Center } from "~/admin/components/FormEditor/DropZone";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";

const ConditionGroup = () => {
    return (
        <Accordion>
            <AccordionItem title="Condition Group" open={true}>
                <Center
                    onDrop={item => {
                        // We don't want to drop steps inside of steps
                        return undefined;
                    }}
                >
                    {`Drop your first field here`}
                </Center>
            </AccordionItem>
        </Accordion>
    );
};

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-condition-group",
    field: {
        type: "condition-group",
        name: "conditionGroup",
        label: "Condition Group",
        description: "Condition Group, show or hide group based on rule",
        icon: <TextIcon />,
        createField() {
            return {
                fieldId: "condition-group1",
                type: this.type,
                name: this.name,
                label: "CG1",
                validation: [],
                settings: {
                    defaultValue: "",
                    layout: []
                }
            };
        },
        renderSettings({ form }) {
            const { Bind } = form;
            // TODO: @ts-adrian: spread Bind komponente na donju komponentu
            return (
                <Grid>
                    {/* <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <Input
                                label={"Placeholder text"}
                                description={"Placeholder text (optional)"}
                            />
                        </Bind>
                    </Cell> */}
                    <Cell span={12}>
                        <ConditionGroup />
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
