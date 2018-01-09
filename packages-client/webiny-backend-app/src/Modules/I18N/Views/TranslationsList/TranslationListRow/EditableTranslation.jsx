import React from 'react';
import {Webiny} from 'webiny-client';
import css from './EditableTranslation.scss';
import _ from 'lodash';

/**
 * @i18n.namespace  Webiny.Backend.I18N.EditableTranslation
 */
class EditableTranslation extends Webiny.Ui.Component {
    constructor(props) {
        super();
        this.ref = null;
        this.state = _.assign({}, props, {edit: false});
        this.bindMethods('showForm,hideForm');
    }

    showForm() {
        this.setState({edit: true});
        setTimeout(() => this.ref.querySelector('textarea').focus(), 100);
    }

    hideForm() {
        this.setState({edit: false});
    }
}

EditableTranslation.defaultProps = {
    locale: null,
    text: null,
    translation: null,
    renderer() {
        const Ui = this.props.Ui;
        const {text, locale, translation, edit} = this.state;

        let translationText = _.get(translation, 'text');
        if (_.isEmpty(translationText)) {
            translationText = <div className={css.noTranslationLabel}>{this.i18n('No translation')}</div>;
        } else {
            translationText = <div>{translationText}</div>;
        }

        return (
            <div ref={ref => this.ref = ref} className={css.editableTranslation} onClick={edit ? _.noop : this.showForm}>
                <label>
                    {!_.isEmpty(_.get(translation, 'text')) && <Ui.Icon icon="icon-check"/>}
                    {locale.label}
                </label>
                {this.state.edit ? (
                    <Ui.Form
                        defaultModel={{locale: locale.key, text: _.get(translation, 'text')}}
                        api="/entities/webiny/i18n-texts"
                        onSubmit={({model, form}) => {
                            this.hideForm();
                            model.text = _.trim(model.text);
                            this.setState({translation: model}, async () => {
                                const response = await form.api.patch(`/${text.id}/translations`, model);
                                if (response.isError()) {
                                    this.showForm();
                                    return Webiny.Growl.danger(response.getMessage());
                                }

                                Webiny.Growl.success(this.i18n('Translation successfully saved!'));
                            });
                        }}>
                        {() => {
                            const shortcut = navigator.platform === 'MacIntel' ? 'Cmd + Enter' : 'Ctrl + Enter';
                            return (
                                <Ui.Textarea
                                    placeholder={this.i18n('Press {shortcut} to save translation or Esc to cancel', {shortcut})}
                                    name="text"
                                    onKeyUp={event => event.key === 'Escape' && this.hideForm()}/>
                            );
                        }}
                    </Ui.Form>
                ) : translationText}
            </div>
        );
    }
};

export default Webiny.createComponent(EditableTranslation, {
    modulesProp: 'Ui',
    modules: ['Form', 'Textarea', 'Form', 'Icon']
});
