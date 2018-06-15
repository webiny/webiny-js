import React from "react";
import { inject } from "webiny-client";
import { withModalDialog } from "webiny-client-ui";

@withModalDialog()
@inject({
    modules: ["Modal", "Form", "Button", "Input", "Tabs", "Grid"]
})
class Settings extends React.Component {
    render() {
        const {
            value,
            onChange,
            modules: { Modal, Button, Form, Tabs, Input, Grid }
        } = this.props;

        return (
            <Modal.Dialog>
                <Form
                    model={value}
                    onSubmit={model => {
                        onChange(model);
                        this.props.hide();
                    }}
                >
                    {({ form, Bind }) => (
                        <Modal.Content>
                            <Modal.Header title="Page settings" onClose={this.props.hide} />
                            <Modal.Body noPadding>
                                <Tabs position={"left"}>
                                    <Tabs.Tab label={"General"} icon={"cogs"}>
                                        <Bind name="slug" validators={["required"]}>
                                            <Input label="Slug" />
                                        </Bind>
                                        <Bind name="settings.random" validators={["required"]}>
                                            <Input label="Random value" />
                                        </Bind>
                                    </Tabs.Tab>
                                    <Tabs.Tab label={"SEO"} icon={"search"}>
                                        <Grid.Row>
                                            <Grid.Col all={12}>TODO: add stuff</Grid.Col>
                                        </Grid.Row>
                                    </Tabs.Tab>
                                </Tabs>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button type="default" label="Cancel" onClick={this.props.hide} />
                                <Button type="primary" label="Save" onClick={form.submit} />
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>
        );
    }
}

export default Settings;
