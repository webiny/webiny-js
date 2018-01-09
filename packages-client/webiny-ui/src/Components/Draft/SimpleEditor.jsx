import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import Editor from './Editor';

class SimpleEditor extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        const {Draft} = props;

        const pluginConfigs = {
            Link: {validate: 'required'}
        };

        _.assign(pluginConfigs, props.pluginConfigs);

        let plugins = [
            new Draft.Plugins.Heading(),
            new Draft.Plugins.Bold(),
            new Draft.Plugins.Italic(),
            new Draft.Plugins.Underline(),
            new Draft.Plugins.UnorderedList(),
            new Draft.Plugins.OrderedList(),
            new Draft.Plugins.Alignment(),
            new Draft.Plugins.Link(pluginConfigs['Link']),
            new Draft.Plugins.Blockquote(),
            new Draft.Plugins.Table(),
            new Draft.Plugins.Image(pluginConfigs['Image'])
        ];

        this.plugins = plugins.concat(props.plugins);
    }
}

SimpleEditor.defaultProps = _.merge({}, Editor.defaultProps, {
    pluginConfigs: {},
    renderer() {
        const props = _.omit(this.props, ['plugins', 'renderer']);

        return <Editor plugins={this.plugins} {...props}/>;
    }
});

export default Webiny.createComponent(SimpleEditor, {modules: ['Draft']});