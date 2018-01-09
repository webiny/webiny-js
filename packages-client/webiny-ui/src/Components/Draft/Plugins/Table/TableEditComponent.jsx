import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Editor from './../../Editor';
import TabHandler from './TabHandler';
import TableShortcuts from './TableShortcuts';

import Bold from './../Bold';
import Italic from './../Italic';
import Underline from './../Underline';
import Alignment from './../Alignment';
import Link from './../Link';
import Code from './../Code';

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.Table.TableEditComponent
 */
class TableEditComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);
        this.Draft = props.Draft;

        this.state = {
            rows: _.get(props, 'data.rows', [{
                key: this.Draft.genKey(), columns: [
                    {key: this.Draft.genKey(), data: null}
                ]
            }]),
            headers: _.get(props, 'data.headers', [{key: this.Draft.genKey(), data: null}]),
            numberOfColumns: _.get(props, 'data.numberOfColumns', 1),
            focusedEditor: null
        };

        this.bindMethods(
            'editRow',
            'insertRowBefore',
            'insertRowAfter',
            'deleteRow',
            'insertColumnBefore',
            'insertColumnAfter',
            'deleteColumn',
            'editColumn',
            'selectNextEditor',
            'selectPrevEditor'
        );

        this.plugins = () => [
            new Bold(),
            new Italic(),
            new Underline(),
            new Alignment(),
            new Link(),
            new Code(),
            new TabHandler({selectNextEditor: this.selectNextEditor, selectPrevEditor: this.selectPrevEditor}),
            new TableShortcuts({insertRow: this.insertRowAfter, deleteRow: this.deleteRow})
        ];
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        this.setState({readOnly: props.editor.getPreview() || !props.editor.getReadOnly()});
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(nextProps.data, this.props.data) || !_.isEqual(this.state, nextState);
    }

    selectNextEditor() {
        const columns = this.state.numberOfColumns - 1;
        const rows = this.state.rows.length - 1;
        const {type, row, col} = this.state.focusedEditor;
        if (type === 'head' && col === columns) {
            return this.setFocus('body', 0, 0, true);
        }

        if (col < columns) {
            return this.setFocus(type, row, col + 1, true);
        } else if (col === columns && row < rows) {
            return this.setFocus(type, row + 1, 0, true);
        }

        return false;
    }

    selectPrevEditor() {
        const columns = this.state.numberOfColumns - 1;
        const {type, row, col} = this.state.focusedEditor;
        if (type === 'body' && row === 0 && col === 0) {
            return this.setFocus('head', 0, columns, true);
        }

        if (col > 0) {
            return this.setFocus(type, row, col - 1, true);
        } else if (col === 0) {
            return this.setFocus(type, row - 1, columns, true);
        }

        return false;
    }

    updateRowData(editorState, rowI, colI) {
        this.state.rows[rowI].columns[colI].data = editorState;
        this.setState({rows: this.state.rows}, () => {
            const blockData = this.props.data;
            blockData.rows[rowI].columns[colI].data = this.Draft.convertToRaw(editorState.getCurrentContent());
            this.props.updateBlockData(blockData);
        });
    }

    updateHeaderData(editorState, colI) {
        const state = _.clone(this.state);
        _.set(state, 'headers.' + colI + '.data', editorState);
        this.setState(state, () => {
            const blockData = this.props.data;
            blockData.headers[colI].data = this.Draft.convertToRaw(editorState.getCurrentContent());
            this.props.updateBlockData(blockData);
        });
    }

    setFocus(type, row, col, moveFocusToEnd = false) {
        if (!_.isEqual(this.state.focusedEditor, {type, row, col})) {
            this.setState({focusedEditor: {type, row, col}}, () => {
                if (moveFocusToEnd) {
                    setTimeout(() => {
                        if (type === 'head') {
                            this.refs[this.state.headers[col].key].moveFocusToEnd();
                        } else {
                            const column = this.refs[this.state.rows[row].columns[col].key];
                            column && column.moveFocusToEnd();
                        }
                    });
                }
            });
        }
        return true;
    }

    insertColumnBefore() {
        this.editColumn(this.state.focusedEditor.col);
    }

    insertColumnAfter() {
        this.editColumn(this.state.focusedEditor.col + 1);
    }

    deleteColumn() {
        this.editColumn(this.state.focusedEditor.col, false);
    }

    editColumn(index, insert = true) {
        const rows = _.cloneDeep(this.state.rows);
        // Insert a new column into each row
        _.each(rows, row => {
            const spliceArgs = insert ? [index, 0, {key: this.Draft.genKey(), data: null}] : [index, 1];
            row.columns.splice(...spliceArgs);
        });

        // Insert header column
        const headers = _.cloneDeep(this.state.headers);
        const spliceArgs = insert ? [index, 0, {key: this.Draft.genKey(), data: null}] : [index, 1];
        headers.splice(...spliceArgs);
        const numberOfColumns = headers.length;
        const blockData = this.props.data;
        this.setState({rows, headers, numberOfColumns}, () => {
            blockData.rows = rows;
            blockData.headers = headers;
            blockData.numberOfColumns = numberOfColumns;
            this.props.updateBlockData(blockData);
        });
    }

    insertRowBefore() {
        this.editRow(this.state.focusedEditor.row);
    }

    insertRowAfter() {
        this.editRow(this.state.focusedEditor.row + 1);
    }

    deleteRow() {
        this.editRow(this.state.focusedEditor.row, false);
    }

    editRow(index, insert = true) {
        let spliceArgs = [index, 1];
        if (insert) {
            const columns = Array.from(new Array(this.state.numberOfColumns), (x, i) => i);
            spliceArgs = [index, 0, {
                key: this.Draft.genKey(), columns: columns.map(() => {
                    return {key: this.Draft.genKey(), data: null};
                })
            }];
        }
        const rows = _.cloneDeep(this.state.rows);
        const blockData = this.props.data;
        rows.splice(...spliceArgs);
        this.setState({rows}, () => {
            blockData.rows = rows;
            this.props.updateBlockData(blockData);

            // Focus first cell of the next available row
            if (rows.length < index + 1) {
                index = rows.length - 1;
            }
            this.setFocus('body', index, 0, true);
        });
    }
}

TableEditComponent.defaultProps = {
    renderer() {
        const {headers, rows, numberOfColumns} = this.state;
        const columns = Array.from(new Array(numberOfColumns), (x, i) => i);
        const isBody = _.get(this.state.focusedEditor, 'type') === 'body';

        // Readonly must be TRUE if parent editor is in preview mode, otherwise it is the opposite of the parent editor
        const tableIsReadOnly = this.props.editor.getPreview() || !this.props.editor.getReadOnly();

        return (
            <Webiny.Ui.LazyLoad modules={['Dropdown']}>
                {(Ui) => (
                    <div className="table-wrapper">
                        <Ui.Dropdown title={this.i18n('Actions')} type="balloon" align="right" renderIf={!this.props.editor.getPreview()}>
                            <Ui.Dropdown.Header title={this.i18n('Column')}/>
                            <Ui.Dropdown.Link onClick={this.insertColumnBefore} icon="fa-plus" title={this.i18n('Insert before')}/>
                            <Ui.Dropdown.Link onClick={this.insertColumnAfter} icon="fa-plus" title={this.i18n('Insert after')}/>
                            <Ui.Dropdown.Link onClick={this.deleteColumn} icon="fa-remove" title={this.i18n('Delete')} renderIf={headers.length > 1}/>
                            <Ui.Dropdown.Header title={this.i18n('Row')} renderIf={isBody}/>
                            <Ui.Dropdown.Link onClick={this.insertRowBefore} icon="fa-plus" title={this.i18n('Insert before')} renderIf={isBody}/>
                            <Ui.Dropdown.Link onClick={this.insertRowAfter} icon="fa-plus" title={this.i18n('Insert after')} renderIf={isBody}/>
                            <Ui.Dropdown.Link onClick={this.deleteRow} icon="fa-remove" title={this.i18n('Delete')}
                                              renderIf={isBody && rows.length > 1}/>
                        </Ui.Dropdown>
                        <table className="Webiny_Ui_List_table">
                            <thead>
                            <tr>
                                {columns.map((col, colI) => {
                                    let readOnly = tableIsReadOnly;
                                    if (!readOnly) {
                                        const key = {type: 'head', row: 0, col: colI};
                                        readOnly = !_.isEqual(this.state.focusedEditor, key);
                                    }
                                    return (
                                        <th key={headers[colI].key} onMouseDown={() => this.setFocus('head', 0, colI)}>
                                            <Editor
                                                ref={headers[colI].key}
                                                preview={this.props.editor.getPreview()}
                                                readOnly={readOnly}
                                                toolbar="inline"
                                                plugins={this.plugins()}
                                                value={headers[colI].data}
                                                convertToRaw={false}
                                                delay={1}
                                                stripPastedStyles={true}
                                                onChange={editorState => this.updateHeaderData(editorState, colI)}/>
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((row, rowI) => {
                                return (
                                    <tr key={row.key}>
                                        {columns.map((col, colI) => {
                                            let readOnly = tableIsReadOnly;
                                            if (!readOnly) {
                                                const key = {type: 'body', row: rowI, col: colI};
                                                readOnly = !_.isEqual(this.state.focusedEditor, key);
                                            }

                                            const dataTh = _.get(headers[colI], 'data.blocks[0].text', '');

                                            return (
                                                <td
                                                    key={row.columns[colI].key}
                                                    onMouseDown={() => this.setFocus('body', rowI, colI)}
                                                    data-th={dataTh}>
                                                    <Editor
                                                        stripPastedStyles={true}
                                                        ref={row.columns[colI].key}
                                                        preview={this.props.editor.getPreview()}
                                                        readOnly={readOnly}
                                                        toolbar="inline"
                                                        plugins={this.plugins()}
                                                        value={row.columns[colI].data}
                                                        convertToRaw={false}
                                                        delay={1}
                                                        onChange={editorState => this.updateRowData(editorState, rowI, colI)}/>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default Webiny.createComponent(TableEditComponent, {modules: [{Draft: 'Webiny/Vendors/Draft'}]});