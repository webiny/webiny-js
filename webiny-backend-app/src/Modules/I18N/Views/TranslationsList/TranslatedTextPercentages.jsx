import React from 'react';
import {Webiny} from 'webiny-client';
import css from './TranslatedTextPercentages.scss';

/**
 * @i18n.namespace Webiny.Backend.I18n.TranslationsList.TranslatedTextPercentages
 */
class TranslatedTextPercentages extends Webiny.Ui.Component {
    renderProgressBar(locale, data) {
        let label = this.i18n('N/A');
        let percentage = 0;
        if (data.texts.total) {
            percentage = (locale.count / data.texts.total * 100).toFixed(0);
            label = `${locale.count} / ${data.texts.total} (${percentage}%)`;
        }

        return (
            <progress-bar>
                <bar style={{width: percentage + '%'}}/>
                <label>{label}</label>
            </progress-bar>
        );
    }
}

TranslatedTextPercentages.defaultProps = {
    renderer() {
        const {Ui} = this.props;
        return (
            <div className={css.translatedTextPercentages}>
                <Ui.Section title={this.i18n('Translations')}/>
                <Ui.Data api="/entities/webiny/i18n-texts/stats/translated">
                    {({data}) => (
                        <Ui.Grid.Row>
                            {data.translations.map(item => (
                                <Ui.Grid.Col
                                    key={item.locale.key}
                                    className={css.translatedTextPercentagesLocaleStats}
                                    xs="12"
                                    sm="6"
                                    md="4"
                                    lg="3">
                                    <strong>{item.locale.label}</strong>
                                    {this.renderProgressBar(item, data)}
                                </Ui.Grid.Col>
                            ))}
                        </Ui.Grid.Row>
                    )}
                </Ui.Data>
            </div>

        );
    }
};

export default Webiny.createComponent(TranslatedTextPercentages, {
    modulesProp: 'Ui',
    modules: ['Data', 'Grid', 'Section']
});
