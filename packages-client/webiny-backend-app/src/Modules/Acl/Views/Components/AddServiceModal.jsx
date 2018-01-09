import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import matchOption from './matchOption';

/**
 * @i18n.namespace Webiny.Backend.Acl.AddServiceModal
 */
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

                            this.props.onSubmit(apiResponse.getData());
                        }}>
                        {({form}) => (
                            <Modal.Content>
                                <Modal.Header title={this.i18n('Add service')} onClose={dialog.hide}/>
                                <Modal.Body>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Form.Error/>
                                            <Form.Loader/>
                                            <Select
                                                description={this.i18n(`Services already added are not shown.`)}
                                                placeholder={this.i18n('Select service...')}
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
                                    <Button label={this.i18n('Cancel')} onClick={this.hide}/>
                                    <Button type="primary" label={this.i18n('Add')} onClick={form.submit}/>
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
});