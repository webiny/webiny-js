export default `
import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-app';
import matchOption from './matchOption';
import i18n from 'webiny-i18n';

const t = i18n.namespace(\`Cool.Namespace\`);

class AddServiceModal extends Webiny.Ui.ModalComponent {
    constructor() {
        super();
        this.api = new Webiny.Api.Endpoint('/services/webiny/services');
    }

    renderDialog() {
        const {Modal, Form, Grid, Select, Button} = this.props;

        return (
            <Modal.Dialog>
                {({dialog}) => (
                    <Form
                        onSubmit={async ({model, form}) => {
                            form.showLoading();
                            const query = {
                                details: 'methods',
                                classId: model.service
                            };

                            const apiResponse = await this.api.setQuery(query).get();

                            form.hideLoading();
                            await dialog.hide();

                            console.log(t\`Service {serviceName} saved!\`({serviceName: 'EXAMPLE'}));
                            this.props.onSubmit(apiResponse.getData());
                        }}>
                        {({form}) => (
                            <Modal.Content>
                                <Modal.Header title={t\`Add service\`} onClose={dialog.hide}/>
                                <Modal.Body>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Form.Error/>
                                            <Form.Loader/>
                                            <Select
                                                description={t\`Services already added are not shown.\`}
                                                placeholder={t\`Select service...\`}
                                                name="service"
                                                validate="required"
                                                api="/services/webiny/services"
                                                query={{exclude: this.props.exclude.map(item => item.classId)}}
                                                valueAttr="classId"
                                                textAttr="class"
                                                matcher={matchOption}
                                                optionRenderer={({option}) => (
                                                    <div>
                                                        <strong>{option.data.classId}</strong><br/>{option.data.class}
                                                    </div>
                                                )}
                                                selectedRenderer={({option}) => option.data.classId}
                                                minimumResultsForSearch={5}/>
                                        </Grid.Col>
                                    </Grid.Row>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button label={t\`Cancel\`} onClick={this.hide}/>
                                    <Button type="primary" label={t\`Add\`} onClick={form.submit}/>
                                </Modal.Footer>
                            </Modal.Content>
                        )}
                    </Form>
                )}
            </Modal.Dialog>
        );
    }
}

AddServiceModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    onSubmit: _.noop,
    exclude: [],
});

export default Webiny.createComponent(AddServiceModal, {
    modules: ['Modal', 'Form', 'Grid', 'Select', 'Button']
});`;
