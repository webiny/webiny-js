import React from 'react';
import {Webiny} from 'webiny-client';
import InlineStyle from './../Toolbar/InlineStyle';

class BoldPlugin extends Webiny.Draft.InlineStylePlugin {
    constructor(config) {
        super(config);
        this.name = 'bold';
        this.style = 'BOLD';
    }

    getEditConfig() {
        return {
            toolbar: <InlineStyle icon="fa-bold" plugin={this}/>,
            handleKeyCommand: (command) => {
                if (command === 'bold' && this.editor.getEditorState().getSelection().isCollapsed()) {
                    return true;
                }
            }
        };
    }
}

export default BoldPlugin;