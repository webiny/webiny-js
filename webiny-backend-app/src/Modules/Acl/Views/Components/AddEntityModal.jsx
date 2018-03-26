import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import matchOption from './matchOption';
/**
 * @i18n.namespace Webiny.Backend.Acl.AddEntityModal
 */
class AddEntityModal extends Webiny.Ui.ModalComponent {
    constructor() {
        super();
        this.api = new Webiny.Api.Endpoint('/services/webiny/entities');
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
                                crudMethods: true,
                                classId: model.entity
                            };

                            const apiResponse = await this.api.setQuery(query).get();

                            form.hideLoading();
                            await dialog.hide();

                            this.props.onSubmit(apiResponse.getData());
                        }}>
                        {({form}) => (
                            <Modal.Content>
                                <Modal.Header title={this.i18n('Add entity')} onClose={dialog.hide}/>
                                <Modal.Body>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Form.Error/>
                                            <Form.Loader/>
                                            <Select
                                                description={this.i18n(`Entities already added are not shown.`)}
                                                placeholder={this.i18n('Select entity...')}
                                                name="entity"
                                                validate="required"
                                                api="/services/webiny/entities"
                                                query={{exclude: this.props.exclude.map(item => item.classId)}}
                                                valueAttr="classId"
                                                textAttr="classId"
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

AddEntityModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    onSubmit: _.noop,
    exclude: []
});

export default Webiny.createComponent(AddEntityModal, {
    modules: ['Modal', 'Form', 'Grid', 'Select', 'Button']
});