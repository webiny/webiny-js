import React from 'react';
import _ from 'lodash';
import $ from 'jquery';
import {Webiny} from 'webiny-client';
import Immutable from 'immutable';
import PluginsContainer from './PluginsContainer';
import Toolbar from './Toolbar';
import InlineToolbar from './InlineToolbar';
import CustomViews from './CustomViews';
import './styles.scss';

class Editor extends Webiny.Ui.Component {
    constructor(props) {
        super(props);
        this.Draft = props.Draft;

        this.bindMethods('initialize', 'focus', 'onChange', 'getEditorState', 'setReadOnly', 'moveFocusToEnd');

        this.plugins = new PluginsContainer(props.plugins, this.getEditorMethods(), this.Draft);

        this.state = {
            preview: props.preview,
            readOnly: props.preview || props.readOnly,
            editorState: this.Draft.EditorState.createEmpty(this.plugins.getDecorators())
        };
        this.state.editorState = this.initialize(props);
    }

    initialize(props) {
        if (_.isPlainObject(props.value) && _.has(props.value, 'blocks')) {
            const newEditorState = this.Draft.EditorState.createWithContent(this.Draft.convertFromRaw(props.value), this.plugins.getDecorators());
            return this.Draft.EditorState.forceSelection(newEditorState, this.state.editorState.getSelection());
        }

        return this.state.editorState;
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (!_.has(this.props.value, 'blocks') || (props.preview && !_.isEqual(props.value, this.props.value))) {
            const editorState = this.initialize(props);
            if (editorState) {
                this.setState({editorState});
            }
        }

        if (props.preview !== this.props.preview) {
            this.plugins.setPreview(props.preview);
            return this.setState({preview: props.preview, readOnly: props.preview}, this.forceRerender);
        }

        if (props.readOnly !== this.props.readOnly) {
            this.setState({readOnly: props.readOnly});
        }
    }

    moveFocusToEnd() {
        this.setState({editorState: this.Draft.EditorState.moveFocusToEnd(this.state.editorState)});
    }

    forceRerender() {
        if (!this.state) {
            return;
        }
        const {editorState} = this.state;
        const content = editorState.getCurrentContent();
        const newEditorState = this.Draft.EditorState.createWithContent(content, this.plugins.getDecorators());
        this.setState({editorState: newEditorState});
    }

    focus(e) {
        // Prevent editor focus if event originates from a dropdown
        if ($(e.target).closest('[data-role="dropdown"]').length > 0) {
            return;
        }

        if (!this.state.preview) {
            this.setReadOnly(false);
        }

        setTimeout(() => {
            if (this.refs.editor) {
                this.refs.editor.focus();
            }
        }, 50);
    }

    onChange(editorState = null) {
        clearTimeout(this.delay);
        this.delay = null;
        this.delay = setTimeout(() => {
            this.props.onChange(this.props.convertToRaw ? this.Draft.convertToRaw(editorState.getCurrentContent()) : editorState);
        }, this.props.delay);
        this.setState({editorState});
    }

    getEditorState() {
        return _.get(this.state, 'editorState', null);
    }

    setReadOnly(readOnly) {
        if (!this.props.preview) {
            this.setState({readOnly});
        }
    }

    getEditorMethods() {
        return {
            getEditorState: this.getEditorState,
            setEditorState: this.onChange,
            setReadOnly: this.setReadOnly,
            getReadOnly: () => this.state.readOnly || this.props.readOnly,
            getDecorators: () => this.plugins.getDecorators(),
            getPreview: () => this.props.preview,
            forceRerender: this.forceRerender,
            updateBlockData: (block, data) => {
                const {editorState} = this.state;
                const selection = new this.Draft.SelectionState({
                    anchorKey: block.getKey(),
                    anchorOffset: 0,
                    focusKey: block.getKey(),
                    focusOffset: block.getLength()
                });

                const newContentState = this.Draft.Modifier.mergeBlockData(editorState.getCurrentContent(), selection, Immutable.Map(data || {}));
                const newEditorState = this.Draft.EditorState.push(editorState, newContentState, 'change-block-data');

                this.onChange(newEditorState);
            }
        };
    }
}

Editor.defaultProps = {
    delay: 400,
    value: null,
    convertToRaw: true,
    plugins: [],
    preview: false,
    readOnly: false,
    toolbar: true,
    toolbarFloat: false,
    stripPastedStyles: false,
    onChange: _.noop,
    renderer() {
        const {editorState} = this.state;
        if (!editorState) {
            return null;
        }

        let toolbar = null;
        if (this.props.toolbar === true) {
            toolbar = <Toolbar readOnly={this.state.readOnly} plugins={this.plugins} floating={this.props.toolbarFloat}/>;
        }

        if (this.props.toolbar === 'inline') {
            const show = !editorState.getSelection().isCollapsed() && !this.state.readOnly;
            toolbar = <InlineToolbar editor={this} show={show} plugins={this.plugins}/>;
        }


        this.plugins.setPreview(this.props.preview);

        const DraftEditor = this.Draft.Editor;

        return (
            <div className={this.classSet('rich-editor', 'rich-editor__root', (this.props.preview && 'preview'))} onMouseDown={this.focus}>
                {toolbar}
                <div className={this.classSet(this.props.className, 'rich-editor__editor')}>
                    <DraftEditor
                        blockRenderMap={this.plugins.getBlockRenderMap()}
                        blockRendererFn={this.plugins.getBlockRendererFn()}
                        blockStyleFn={this.plugins.getBlockStyleFn()}
                        customStyleMap={this.plugins.getCustomStyleMap()}
                        handleKeyCommand={this.plugins.getHandleKeyCommandFn()}
                        keyBindingFn={this.plugins.getKeyBindingFn()}
                        handleReturn={this.plugins.getHandleReturnFn()}
                        handlePastedText={this.plugins.getHandlePastedTextFn()}
                        onTab={this.plugins.getOnTabFn()}
                        //
                        ref="editor"
                        readOnly={this.state.readOnly}
                        editorState={editorState}
                        onChange={this.onChange}
                        placeholder={this.props.placeholder}
                        stripPastedStyles={this.props.stripPastedStyles}
                        spellCheck={true}/>
                    <CustomViews preview={this.props.preview} plugins={this.plugins}/>
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(Editor, {
    api: ['focus'],
    modules: [{Draft: 'Webiny/Vendors/Draft'}]
});