import React from 'react';
import {Webiny} from 'webiny-client';
import Atomic from './../Toolbar/Atomic';

const languageMap = {
    'html': 'text/html',
    'json': 'application/json',
    'jsx': 'text/jsx',
    'javascript': 'text/javascript',
    'php': 'text/x-php',
    'shell': 'text/x-sh',
    'yaml': 'text/x-yaml'
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.CodeBlockEditComponent
 */
class CodeBlockEditComponent extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('switchLanguage');
    }

    switchLanguage(language) {
        this.editor.focus();
        this.props.updateBlockData({language});
    }
}

CodeBlockEditComponent.defaultProps = {
    renderer() {
        const editorProps = {
            ref: (editor) => this.editor = editor,
            mode: languageMap[this.props.data.language],
            value: this.props.data.code || '',
            onFocus: () => {
                this.props.editor.setReadOnly(true);
            },
            onChange: value => {
                this.props.updateBlockData({code: value});
            }
        };

        return (
            <Webiny.Ui.LazyLoad modules={['Grid', 'Dropdown', 'CodeEditor']}>
                {(Ui) => (
                    <Ui.Grid.Row>
                        <Ui.Grid.Col all={12} className="code-block">
                            <div style={{position: 'absolute', right: 20, top: 5}}>
                                <Ui.Dropdown title={this.props.data.language || 'jsx'} type="balloon">
                                    <Ui.Dropdown.Header title={this.i18n('Language')}/>
                                    <Ui.Dropdown.Link title={this.i18n('HTML')} onClick={() => this.switchLanguage('html')}/>
                                    <Ui.Dropdown.Link title={this.i18n('JSON')} onClick={() => this.switchLanguage('json')}/>
                                    <Ui.Dropdown.Link title={this.i18n('JSX')} onClick={() => this.switchLanguage('jsx')}/>
                                    <Ui.Dropdown.Link title={this.i18n('JAVASCRIPT')} onClick={() => this.switchLanguage('javascript')}/>
                                    <Ui.Dropdown.Link title={this.i18n('PHP')} onClick={() => this.switchLanguage('php')}/>
                                    <Ui.Dropdown.Link title={this.i18n('SHELL')} onClick={() => this.switchLanguage('shell')}/>
                                    <Ui.Dropdown.Link title={this.i18n('YAML')} onClick={() => this.switchLanguage('yaml')}/>
                                </Ui.Dropdown>
                            </div>
                            <Ui.CodeEditor {...editorProps}/>
                        </Ui.Grid.Col>
                    </Ui.Grid.Row>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.CodeBlockPreviewComponent
 */
class CodeBlockPreviewComponent extends Webiny.Ui.Component {
}

CodeBlockPreviewComponent.defaultProps = {
    renderer() {
        const editorProps = {
            mode: languageMap[this.props.data.language],
            value: this.props.data.code || '',
            readOnly: true,
            noCursor: true
        };

        return (
            <Webiny.Ui.LazyLoad modules={['CodeEditor']}>
                {(Ui) => (
                    <div className="code-block code-block--preview">
                        <Ui.CodeEditor {...editorProps}/>
                    </div>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.CodeBlockPlugin
 */
class CodeBlockPlugin extends Webiny.Draft.AtomicPlugin {
    constructor(config) {
        super(config);
        this.name = 'code-block';
    }

    createBlock() {
        const insert = {
            type: 'atomic',
            text: ' ',
            data: {
                plugin: this.name
            },
            entity: {
                type: this.name,
                mutability: 'IMMUTABLE'
            }
        };
        const editorState = this.insertDataBlock(this.editor.getEditorState(), insert);
        this.editor.setEditorState(editorState);
    }

    getEditConfig() {
        return {
            toolbar: <Atomic icon="fa-code" plugin={this} tooltip="Insert code block"/>,
            blockRendererFn: (contentBlock) => {
                const plugin = contentBlock.getData().get('plugin');
                if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                    return {
                        component: CodeBlockEditComponent,
                        editable: false
                    };
                }
            }
        };
    }

    getPreviewConfig() {
        const editConfig = this.getEditConfig();
        editConfig.blockRendererFn = (contentBlock) => {
            const plugin = contentBlock.getData().get('plugin');
            if (contentBlock.getType() === 'atomic' && plugin === this.name) {
                return {
                    component: CodeBlockPreviewComponent,
                    editable: false
                };
            }
        };
        return editConfig;
    }
}

export default CodeBlockPlugin;