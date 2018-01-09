import {Webiny} from 'webiny-client';
import Views from './Views/Views';
import React from 'react';

/**
 * @i18n.namespace Webiny.Backend.I18n
 */
class Module extends Webiny.App.Module {
    init() {
        this.name = 'I18N';
        const Menu = Webiny.Ui.Menu;

        this.registerMenus(
            <Menu label={Webiny.I18n('I18N')} icon="icon-earth" role="webiny-i18n-manager">
                <Menu label={Webiny.I18n('Texts')} order={100}>
                    <Menu label={Webiny.I18n('Translations')} route="I18N.Translations.List" order={100}/>
                    <Menu label={Webiny.I18n('Texts')} route="I18N.Texts.List" order={101}/>
                    <Menu label={Webiny.I18n('Text Groups')} route="I18N.TextGroups.List" order={102}/>
                </Menu>
                <Menu label={Webiny.I18n('Locales')} route="I18N.Locales.List" order={101}/>
            </Menu>
        );


        this.registerRoutes(
            new Webiny.Route('I18N.Locales.List', '/i18n/locales', Views.LocalesList, 'I18N - List Locales'),
            new Webiny.Route('I18N.Texts.List', '/i18n/texts', Views.TextsList, 'I18N - List Texts'),
            new Webiny.Route('I18N.TextGroups.List', '/i18n/text-groups', Views.TextGroupsList, 'I18N - List Text Groups'),
            new Webiny.Route('I18N.Translations.List', '/i18n/translations', Views.TranslationsList, 'I18N - List Translations')
        );
    }
}

export default Module;