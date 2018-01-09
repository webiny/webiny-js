import React from 'react';
import {Webiny} from 'webiny-client';
import InlineStyle from './../Toolbar/InlineStyle';

class ItalicPlugin extends Webiny.Draft.InlineStylePlugin {
    constructor(config) {
        super(config);
        this.name = 'bold';
        this.style = 'ITALIC';
    }

    getEditConfig() {
        return {
            toolbar: <InlineStyle icon="fa-italic" plugin={this}/>,
            handleKeyCommand: (command, editor) => {
                if (command === 'italic' && editor.getEditorState().getSelection().isCollapsed()) {
                    return true;
                }
            }
        };
    }
}

export default ItalicPlugin;