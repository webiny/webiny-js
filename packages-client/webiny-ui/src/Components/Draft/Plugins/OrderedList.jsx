import React from 'react';
import {Webiny} from 'webiny-client';
import BlockType from './../Toolbar/BlockType';

class OrderedListPlugin extends Webiny.Draft.BlockTypePlugin {
    constructor(config) {
        super(config);
        this.name = 'ordered-list';
        this.block = 'ordered-list-item';
    }

    getEditConfig() {
        return {
            toolbar: <BlockType icon="fa-list-ol" plugin={this} tooltip="Toggle ordered list"/>
        };
    }
}

export default OrderedListPlugin;