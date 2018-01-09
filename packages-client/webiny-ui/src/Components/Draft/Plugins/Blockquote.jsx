import React from 'react';
import {Webiny} from 'webiny-client';
import BlockType from './../Toolbar/BlockType';

class BlockquotePlugin extends Webiny.Draft.BlockTypePlugin {
    constructor(config) {
        super(config);
        this.name = 'blockquote';
        this.block = 'blockquote';
    }

    getEditConfig() {
        return {
            toolbar: (
                <BlockType icon="fa-quote-right" plugin={this} tooltip="Make a quote"/>
            )
        };
    }
}

export default BlockquotePlugin;