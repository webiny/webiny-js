import React from 'react';
import {Webiny} from 'webiny-client';
import css from './TextRow.scss';
import EditableTranslation from './TranslationListRow/EditableTranslation';
import _ from 'lodash';

class TextRow extends Webiny.Ui.Component {
}

TextRow.defaultProps = {
    text: null,
    locales: [],
    renderer() {
        const {Ui, text} = this.props;
        return (
            <div className={css.translationListRow}>
                <div onClick={this.toggle}>
                    <div>
                        <h1 className="base">{text.base}</h1>
                        <code className="key">{text.key}</code>
                    </div>
                    <translations>
                        <ul>
                            {this.props.locales.map(locale => {
                                const translation = _.find(text.translations, {locale: locale.key});
                                return (
                                    <li key={_.uniqueId()}>
                                        <EditableTranslation
                                            locale={locale}
                                            text={text}
                                            translation={translation}/>
                                    </li>
                                );
                            })}
                        </ul>
                    </translations>
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(TextRow, {
    modulesProp: 'Ui',
    modules: [
        'Modal', 'Form', 'Grid', 'Input', 'Textarea', 'Button', 'Select', 'Section', 'Input'
    ]
});
