import React from 'react';
import {Webiny} from 'webiny-client';
import InlineStyle from './../Toolbar/InlineStyle';

class UnderlinePlugin extends Webiny.Draft.InlineStylePlugin {
    constructor(config) {
        super(config);
        this.name = 'bold';
        this.style = 'UNDERLINE';
    }

    getEditConfig() {
        return {
            toolbar: <InlineStyle icon="fa-underline" plugin={this}/>,
            handleKeyCommand: (command, editor) => {
                if (command === 'underline' && editor.getEditorState().getSelection().isCollapsed()) {
                    return true;
                }
            }
        };
    }
}

export default UnderlinePlugin;