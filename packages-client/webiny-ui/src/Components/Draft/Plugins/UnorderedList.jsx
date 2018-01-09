import React from 'react';
import {Webiny} from 'webiny-client';
import BlockType from './../Toolbar/BlockType';

class UnorderedListPlugin extends Webiny.Draft.BlockTypePlugin {
    constructor(config) {
        super(config);
        this.name = 'unordered-list';
        this.block = 'unordered-list-item';
    }

    getEditConfig() {
        return {
            toolbar: <BlockType icon="fa-list-ul" plugin={this} tooltip="Toggle unordered list"/>
        };
    }
}

export default UnorderedListPlugin;