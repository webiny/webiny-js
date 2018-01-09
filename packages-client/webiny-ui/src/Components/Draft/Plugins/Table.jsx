import React from 'react';
import {Webiny} from 'webiny-client';
import Atomic from './../Toolbar/Atomic';
import TableEditComponent from './Table/TableEditComponent';

class TablePlugin extends Webiny.Draft.AtomicPlugin {
    constructor(config) {
        super(config);
        this.name = 'table';
    }

    createBlock() {
        const insert = {
            type: 'atomic',
            text: ' ',
            data: {
                plugin: this.name,
                headers: [
                    {key: this.Draft.genKey(), data: null}
                ],
                rows: [
                    {
                        key: this.Draft.genKey(),
                        columns: [
                            {key: this.Draft.genKey(), data: null}
                        ]
                    }
                ],
                numberOfColumns: 1
            }
        };
        const editorState = this.insertDataBlock(this.editor.getEditorState(), insert);
        this.editor.setEditorState(editorState);
    }

    getEditConfig() {
        return {
            toolbar: <Atomic icon="fa-table" plugin={this} tooltip="Insert a table"/>,
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: TableEditComponent,
                        editable: false
                    };
                }
            }
        };
    }
}

TablePlugin.TableEditComponent = TableEditComponent;

export default TablePlugin;