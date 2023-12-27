import React from "react";
import styled from "@emotion/styled";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { Typography } from "@webiny/ui/Typography";
import { Form } from "@webiny/form";
import { useFormEditor } from "../../Context";
import { plugins } from "@webiny/plugins";
import set from "lodash/set";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { FbEditorTrigger } from "~/types";
const t = i18n.namespace("FormsApp.Editor.TriggersTab");

const Container = styled("div")({
    padding: "40px 60px",
    color: "var(--mdc-theme-on-surface)"
});

export const TriggersTab = () => {
    const { setData, data: formData } = useFormEditor();
    const formEditorTriggerPlugins = plugins.byType<FbEditorTrigger>("form-editor-trigger");
    const { showSnackbar } = useSnackbar();

    return (
        <Container>
            <Typography
                use={"overline"}
            >{t`Which actions should be taken after submission`}</Typography>

            <Accordion>
                {formEditorTriggerPlugins.map(({ trigger }) => (
                    <AccordionItem
                        key={trigger.id}
                        icon={trigger.icon}
                        title={trigger.title}
                        description={trigger.description}
                    >
                        <Form
                            data={formData.triggers?.[trigger.id] || {}}
                            onSubmit={submitData => {
                                // TODO @ts-refactor figure out how to type the data param
                                setData(data => {
                                    return set(data, `triggers.${trigger.id}`, submitData);
                                });
                                showSnackbar(t`Form settings updated successfully.`);
                            }}
                        >
                            {({ Bind, submit }) =>
                                trigger.renderSettings({
                                    Bind,
                                    submit,
                                    form: formData
                                })
                            }
                        </Form>
                    </AccordionItem>
                ))}
            </Accordion>
        </Container>
    );
};
