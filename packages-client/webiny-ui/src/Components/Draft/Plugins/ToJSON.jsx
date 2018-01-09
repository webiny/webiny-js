import React from 'react';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.ToJSONPlugin
 */
class ToJSONPlugin extends Webiny.Draft.BasePlugin {
    constructor(config) {
        super(config);
        this.name = 'toJson';
    }

    toJSON() {
        const content = this.editor.getEditorState().getCurrentContent();
        console.log(JSON.stringify(this.Draft.convertToRaw(content), null, 2));
    }

    getEditConfig() {
        return {
            toolbar: (
                <Webiny.Ui.LazyLoad modules={['Button']}>
                    {({Button}) => (
                        <Button onClick={() => this.toJSON()} label={this.i18n('JSON')} tooltip="Log editor content"/>
                    )}
                </Webiny.Ui.LazyLoad>
            )
        };
    }
}

export default ToJSONPlugin;