import React from "react";
import axios from "axios";
import _ from "lodash";
import { ModalComponent } from "webiny-app-ui";
import matchOption from "./matchOption";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.AddEndpointModal");

class AddEndpointModal extends React.Component {
    constructor(props) {
        super(props);
        this.select = null;
        this.endpoints = [];

        axios
            .get("/discover", {
                params: {
                    exclude: props.exclude.map(item => item.classId)
                }
            })
            .then(response => {
                this.endpoints = response.data.data.list;
            });
    }

    render() {
        const { Modal, Form, Grid, Select, Button } = this.props;
        return (
            <Modal.Dialog>
                <Form
                    onSubmit={async ({ model }) => {
                        await this.props.hide();
                        this.props.onSubmit(_.find(this.endpoints, { classId: model.endpoint }));
                    }}
                >
                    {({ form }) => (
                        <Modal.Content>
                            <Modal.Header title={t`Add endpoint`} onClose={this.props.hide} />
                            <Modal.Body>
                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <Form.Error />
                                        <Form.Loader />
                                        {this.endpoints.length > 0 && (
                                            <Select
                                                description={t`Endpoints already added are not shown.`}
                                                placeholder={t`Select endpoint...`}
                                                options={this.endpoints}
                                                name="endpoint"
                                                validate="required"
                                                valueAttr="classId"
                                                textAttr="classId"
                                                matcher={matchOption}
                                                renderOption={({ option }) => (
                                                    <div>
                                                        <strong>{option.data.classId}</strong>
                                                        <br />
                                                        {option.data.url}
                                                    </div>
                                                )}
                                                renderSelected={({ option }) => option.data.classId}
                                                minimumResultsForSearch={5}
                                            />
                                        )}
                                    </Grid.Col>
                                </Grid.Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button label={t`Cancel`} onClick={this.props.hide} />
                                <Button type="primary" label={t`Add`} onClick={form.submit} />
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>
        );
    }
}

export default createComponent([AddEndpointModal, ModalComponent], {
    modules: ["Modal", "Form", "Grid", "Select", "Button"]
});
