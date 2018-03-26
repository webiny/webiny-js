import React from 'react';
import {Webiny} from 'webiny-client';
import ExportTranslationsModal from './TranslationsList/ExportTranslationsModal';
import ImportTranslationsModal from './TranslationsList/ImportTranslationsModal';
import TextRow from './TranslationsList/TextRow';
import TranslatedTextPercentages from './TranslationsList/TranslatedTextPercentages';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.I18N.TranslationsList
 */
class TranslationsList extends Webiny.Ui.View {
    constructor() {
        super();
        this.ref = null;
        this.state = {locales: null};
    }

    componentWillMount() {
        super.componentWillMount();
        Webiny.I18n.getLocales().then(locales => this.setState({locales}));
    }
}

TranslationsList.defaultProps = {
    renderer() {
        return (
            <Webiny.Ui.LazyLoad
                modules={['ViewSwitcher', 'View', 'Button', 'ButtonGroup', 'Icon', 'List', 'Input', 'Form', 'Grid', 'Select', 'Alert', 'Link']}>
                {Ui => (
                    <Ui.ViewSwitcher>
                        <Ui.ViewSwitcher.View view="translationsList" defaultView>
                            {({showView}) => (
                                <Ui.View.List>
                                    <Ui.View.Header
                                        title={this.i18n(`Translations`)}
                                        description={(
                                            this.i18n('Manage translations for {linkToTextsSection} in all installed apps.', {
                                                linkToTextsSection: <Ui.Link route="I18N.Texts.List">{this.i18n('texts')}</Ui.Link>
                                            })
                                        )}>
                                        <Ui.ButtonGroup>
                                            <Ui.Button
                                                type="primary"
                                                onClick={showView('importTranslationsModal')}
                                                icon="fa-download"
                                                label={this.i18n(`Import`)}/>
                                            <Ui.Button
                                                type="secondary"
                                                onClick={showView('exportTranslationsModal')}
                                                icon="fa-upload"
                                                label={this.i18n(`Export`)}/>
                                        </Ui.ButtonGroup>
                                    </Ui.View.Header>
                                    <Ui.View.Body>
                                        {_.isArray(this.state.locales) && _.isEmpty(this.state.locales) ? (
                                            <Ui.Alert>
                                                {this.i18n('Before editing translations, header over to {locales} section and create a locale.', {
                                                    locales: <Ui.Link route="I18N.Locales.List">{this.i18n('Locales')}</Ui.Link>
                                                })}
                                            </Ui.Alert>
                                        ) : <TranslatedTextPercentages/>}
                                        <Ui.List
                                            ref={ref => this.ref = ref}
                                            connectToRouter
                                            title={this.i18n(`Translations`)}
                                            api="/entities/webiny/i18n-texts"
                                            searchFields="key,base,app,translations.text"
                                            fields="key,base,translations"
                                            sort="-createdOn">
                                            <Ui.List.FormFilters>
                                                {({apply}) => (
                                                    <Ui.Grid.Row>
                                                        <Ui.Grid.Col all={4}>
                                                            <Ui.Input
                                                                name="_searchQuery"
                                                                placeholder={this.i18n('Search by key, text or translation')}
                                                                onEnter={apply()}/>
                                                        </Ui.Grid.Col>
                                                        <Ui.Grid.Col all={4}>
                                                            <Ui.Select
                                                                name="app"
                                                                api="/services/webiny/apps"
                                                                url="/installed"
                                                                textAttr="name"
                                                                valueAttr="name"
                                                                placeholder={this.i18n('Filter by app')}
                                                                allowClear
                                                                onChange={apply()}/>
                                                        </Ui.Grid.Col>
                                                        <Ui.Grid.Col all={4}>
                                                            <Ui.Select
                                                                api="/entities/webiny/i18n-text-groups"
                                                                name="group"
                                                                placeholder={this.i18n('Filter by text group')}
                                                                allowClear
                                                                onChange={apply()}/>
                                                        </Ui.Grid.Col>
                                                    </Ui.Grid.Row>
                                                )}
                                            </Ui.List.FormFilters>
                                            <Ui.List.Table>
                                                <Ui.List.Table.Row>
                                                    <Ui.List.Table.Field label={this.i18n('Text')} align="left">
                                                        {({data}) => <TextRow locales={this.state.locales} text={data}/>}
                                                    </Ui.List.Table.Field>
                                                </Ui.List.Table.Row>
                                                <Ui.List.Table.Footer/>
                                            </Ui.List.Table>
                                            <Ui.List.Pagination/>
                                        </Ui.List>
                                    </Ui.View.Body>
                                </Ui.View.List>
                            )}
                        </Ui.ViewSwitcher.View>
                        <Ui.ViewSwitcher.View view="exportTranslationsModal" modal>
                            {({showView, data: {data}}) => (
                                <ExportTranslationsModal {...{showView, data}}/>
                            )}
                        </Ui.ViewSwitcher.View>
                        <Ui.ViewSwitcher.View view="importTranslationsModal" modal>
                            {({showView, data: {data}}) => (
                                <ImportTranslationsModal {...{showView, data}} onTranslationsImported={() => this.ref.loadData()}/>
                            )}
                        </Ui.ViewSwitcher.View>
                    </Ui.ViewSwitcher>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default TranslationsList;