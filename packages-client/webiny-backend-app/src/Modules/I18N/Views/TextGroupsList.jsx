import React from 'react';
import {Webiny} from 'webiny-client';
import TextGroupsModal from './TextGroupsList/TextGroupsModal';

/**
 * @i18n.namespace Webiny.Backend.I18N.TextGroupsList
 */
class TextGroupsList extends Webiny.Ui.View {
    constructor() {
        super();
        this.ref = null;
    }
}

TextGroupsList.defaultProps = {
    renderer () {
        return (
            <Webiny.Ui.LazyLoad modules={['ViewSwitcher', 'View', 'Button', 'List']}>
                {Ui => (
                    <Ui.ViewSwitcher>
                        <Ui.ViewSwitcher.View view="groupsList" defaultView>
                            {({showView}) => (
                                <Ui.View.List>
                                    <Ui.View.Header title={this.i18n(`Text Groups`)}>
                                        <Ui.Button
                                            type="primary"
                                            align="right"
                                            onClick={showView('groupsModal')}
                                            icon="icon-plus-circled"
                                            label={this.i18n(`Create`)}/>
                                    </Ui.View.Header>
                                    <Ui.View.Body>
                                        <Ui.List
                                            ref={ref => this.ref = ref}
                                            connectToRouter
                                            title={this.i18n(`Text Groups`)}
                                            api="/entities/webiny/i18n-text-groups"
                                            fields="name,app,totalTexts,createdOn"
                                            sort="-createdOn">
                                            <Ui.List.Table>
                                                <Ui.List.Table.Row>
                                                    <Ui.List.Table.Field name="name" label={this.i18n('Name')}/>
                                                    <Ui.List.Table.Field name="app" label={this.i18n('App')} align="center"/>
                                                    <Ui.List.Table.NumberField name="totalTexts" label={this.i18n('Total Texts')} align="center"/>
                                                    <Ui.List.Table.DateField name="createdOn" label={this.i18n('Created On')} align="center"/>
                                                    <Ui.List.Table.Actions>
                                                        <Ui.List.Table.EditAction onClick={showView('groupsModal')}/>
                                                        <Ui.List.Table.DeleteAction/>
                                                    </Ui.List.Table.Actions>
                                                </Ui.List.Table.Row>
                                                <Ui.List.Table.Footer/>
                                            </Ui.List.Table>
                                            <Ui.List.Pagination/>
                                        </Ui.List>
                                    </Ui.View.Body>
                                </Ui.View.List>
                            )}
                        </Ui.ViewSwitcher.View>
                        <Ui.ViewSwitcher.View view="groupsModal" modal>
                            {({showView, data: {data}}) => (
                                <TextGroupsModal {...{showView, data}} onSubmitSuccess={() => this.ref.loadData()}/>
                            )}
                        </Ui.ViewSwitcher.View>
                    </Ui.ViewSwitcher>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default TextGroupsList;