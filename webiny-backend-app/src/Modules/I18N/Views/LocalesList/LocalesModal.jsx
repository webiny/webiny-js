import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.I18N.TextsList
 */
class LocalesModal extends Webiny.Ui.ModalComponent {
    renderDialog() {
        const {Button, Modal, Link, Grid, Form, Select, Switch, Section, Input} = this.props;

        return (
            <Modal.Dialog wide>
                <Form
                    id={_.get(this.props, 'data.id')}
                    defaultModel={{formats: Webiny.I18n.getDefaultFormats()}}
                    fields="key,label,formats,default,enabled"
                    api="/entities/webiny/i18n-locales"
                    onSubmitSuccess={apiResponse => this.hide().then(() => this.props.onSubmitSuccess(apiResponse))}
                    onSuccessMessage={null}>
                    {({model, form}) => {
                        const id = _.get(this.props, 'data.id');
                        const url = id ? `/available/${id}` : '/available';
                        return (
                            <Modal.Content>
                                <Form.Loader/>
                                <Modal.Header title={id ? this.i18n('Edit Locale') : this.i18n('Create Locale')} onClose={this.hide}/>
                                <Modal.Body>
                                    <Form.Error/>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Select
                                                label={this.i18n('Locale')}
                                                description={this.i18n(`Already added locales are not listed.`)}
                                                placeholder={this.i18n('Select locale to add...')}
                                                name="key"
                                                validate="required"
                                                api="/entities/webiny/i18n-locales"
                                                url={url}/>
                                        </Grid.Col>
                                        <Grid.Col all={5}>
                                            <Switch
                                                description={this.i18n('Only one locale can be set as default.')}
                                                label={this.i18n('Default')}
                                                name="default"/>
                                        </Grid.Col>
                                        <Grid.Col all={5}>
                                            <Switch
                                                description={this.i18n('Set whether or not this locale is available for the public.')}
                                                label={this.i18n('Enabled')}
                                                name="enabled"/>
                                        </Grid.Col>
                                    </Grid.Row>
                                    <Section title={this.i18n('Dates')}/>
                                    <Grid.Row>
                                        <Grid.Col all={7}>
                                            <Input label={this.i18n('Date')} name="formats.date" placeholder={this.i18n('eg. d/m/Y')}/>
                                        </Grid.Col>
                                        <Grid.Col all={5}>
                                            <Input
                                                disabled
                                                label={this.i18n('Preview')}
                                                value={Webiny.I18n.date(new Date(), model.formats.date)}
                                                placeholder={this.i18n('Type format to see example.')}/>
                                        </Grid.Col>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Col all={7}>
                                            <Input label={this.i18n('Time')} name="formats.time" placeholder={this.i18n('eg. h:i')}/>
                                        </Grid.Col>
                                        <Grid.Col all={5}>
                                            <Input
                                                disabled
                                                label={this.i18n('Preview')}
                                                value={Webiny.I18n.time(new Date(), model.formats.time)}
                                                placeholder={this.i18n('Type format to see example.')}/>
                                        </Grid.Col>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Col all={7}>
                                            <Input
                                                label={this.i18n('Date/Time')}
                                                name="formats.datetime"
                                                placeholder={this.i18n('eg. d/m/Y h:i')}/>
                                        </Grid.Col>
                                        <Grid.Col all={5}>
                                            <Input
                                                disabled
                                                label={this.i18n('Preview')}
                                                value={Webiny.I18n.datetime(new Date(), model.formats.datetime)}
                                                placeholder={this.i18n('Type format to see example.')}/>
                                        </Grid.Col>
                                    </Grid.Row>
                                    <Section title={this.i18n('Prices')}/>
                                    <Grid.Row>
                                        <Grid.Col all={2}>
                                            <Input
                                                tooltip={this.i18n('Use {value} and {symbol} placeholders to define output.')}
                                                label={this.i18n('Format')}
                                                placeholder={this.i18n('eg. "{value}{symbol}"')}
                                                name="formats.price.format"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Symbol')}
                                                placeholder={this.i18n('eg. "$"')}
                                                name="formats.price.symbol"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Decimal')}
                                                placeholder={this.i18n('eg. "."')}
                                                name="formats.price.decimal"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Thousand')}
                                                placeholder={this.i18n('eg. ","')}
                                                name="formats.price.thousand"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Precision')}
                                                placeholder={this.i18n('eg. "2"')}
                                                name="formats.price.precision"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                disabled
                                                label={this.i18n('Preview')}
                                                value={Webiny.I18n.price(12345.67, model.formats.price)}
                                                placeholder={this.i18n('Type format to see example.')}/>
                                        </Grid.Col>
                                    </Grid.Row>

                                    <Section title={this.i18n('Numbers')}/>
                                    <Grid.Row>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Decimal')}
                                                placeholder={this.i18n('eg. "."')}
                                                name="formats.number.decimal"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Thousand')}
                                                placeholder={this.i18n('eg. ","')}
                                                name="formats.number.thousand"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                label={this.i18n('Precision')}
                                                placeholder={this.i18n('eg. "2"')}
                                                name="formats.number.precision"/>
                                        </Grid.Col>
                                        <Grid.Col all={2}>
                                            <Input
                                                disabled
                                                label={this.i18n('Preview')}
                                                value={Webiny.I18n.number(12345.67, model.formats.number)}
                                                placeholder={this.i18n('Type format to see example.')}/>
                                        </Grid.Col>
                                    </Grid.Row>

                                </Modal.Body>
                                <Modal.Footer>
                                    <Button label={this.i18n('Cancel')} onClick={this.hide}/>
                                    <Button type="primary" label={this.i18n('Save')} onClick={form.submit}/>
                                </Modal.Footer>
                            </Modal.Content>
                        );
                    }}
                </Form>
                )}
            </Modal.Dialog>
        );
    }
}

LocalesModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    onSubmitSuccess: _.noop,
});

export default Webiny.createComponent(LocalesModal, {
    modules: ['Button', 'Modal', 'Link', 'Grid', 'Form', 'Select', 'Switch', 'Section', 'Input']
});