import React from 'react';
/**
 * @i18n.namespace Webiny.Ui.Downloader.Ideas.Example
 */
<Ui.Download>
    <Ui.Download.Element>
        {({download}) => (
            <Ui.Link type="secondary" align="right" onClick={download}>
                <Ui.Icon icon="icon-file-o"/> Export summary
            </Ui.Link>
        )}
    </Ui.Download.Element>
    <Ui.Download.Dialog>
        {({download}) => {
            const submit = ({model: filters}) => download('GET', '/entities/demo/records/report/summary', null, filters);
            return (
                <Ui.Modal.Dialog>
                    {({dialog}) => (
                        <Ui.Form onSubmit={submit}>
                            {({form}) => (
                                <Ui.Modal.Content>
                                    <Ui.Modal.Header title={this.i18n('Export summary')}/>
                                    <Ui.Modal.Body>
                                        <Ui.Grid.Row>
                                            <Ui.Grid.Col all={12}>
                                                <Ui.Select
                                                    name="enabled"
                                                    validate="required"
                                                    label={this.i18n('Filter by status')}
                                                    placeholder={this.i18n('All records')}
                                                    allowClear
                                                    description={this.i18n('Records will be filtered based on your selection')}>
                                                    <option value="true">Enabled</option>
                                                    <option value="false">Disabled</option>
                                                </Ui.Select>
                                            </Ui.Grid.Col>
                                        </Ui.Grid.Row>
                                    </Ui.Modal.Body>
                                    <Ui.Modal.Footer>
                                        <Ui.Button type="default" label={this.i18n('Cancel')} onClick={dialog.hide}/>
                                        <Ui.Button type="primary" label={this.i18n('Export')} onClick={form.submit}/>
                                    </Ui.Modal.Footer>
                                </Ui.Modal.Content>
                            )}
                        </Ui.Form>
                    )}
                </Ui.Modal.Dialog>
            );
        }}
    </Ui.Download.Dialog>
</Ui.Download>