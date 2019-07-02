import React from "react";
import styled from "react-emotion";
import { Accordion, AccordionItem } from "webiny-ui/Accordion";
import { Typography } from "webiny-ui/Typography";
import { Form } from "webiny-form";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { getPlugins } from "webiny-plugins";
import { get, set } from "lodash";
import { withSnackbar } from "webiny-admin/components";
import { compose } from "recompose";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.Editor.TriggersTab");

const Container = styled("div")({
    padding: "40px 60px"
});

export const TriggersTab = compose(withSnackbar())(({ showSnackbar }) => {
    const { setData, data: formData } = useFormEditor();
    const plugins = getPlugins("form-editor-trigger");

    return (
        <Container>
            <Typography use={"overline"}>Which actions should be taken after submission</Typography>

            <Accordion>
                {plugins.map(({ trigger }) => {
                    return (
                        <AccordionItem
                            key={trigger.id}
                            icon={trigger.icon}
                            title={trigger.title}
                            description={trigger.description}
                        >
                            <Form
                                data={get(formData, `triggers.${trigger.id}`, {})}
                                onSubmit={submitData => {
                                    setData(data =>
                                        set(data, `triggers.${trigger.id}`, submitData)
                                    );
                                    showSnackbar(t`Form settings updated successfully.`);
                                }}
                            >
                                {({ Bind, submit }) => {
                                    return trigger.renderSettings({
                                        Bind,
                                        submit
                                    });
                                }}
                            </Form>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </Container>
    );
});
