import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import PluginBlock from './PluginBlock';

export default class PluginsContainer {
    constructor(plugins, editor, Draft) {
        this.Draft = Draft;
        this.editor = editor;
        this.plugins = plugins;
        this.config = {
            edit: {
                toolbar: [],
                customView: [],
                blockRenderMap: {},
                blockRendererFn: [],
                blockStyleFn: [],
                customStyleMap: {},
                decorators: [],
                handleKeyCommand: [],
                keyBindingFn: [],
                handleReturn: [],
                handlePastedText: [],
                onTab: []
            },
            preview: {
                toolbar: [],
                customView: [],
                blockRenderMap: {},
                blockRendererFn: [],
                blockStyleFn: [],
                customStyleMap: {},
                decorators: [],
                handleKeyCommand: [],
                keyBindingFn: [],
                handleReturn: [],
                handlePastedText: [],
                onTab: []
            }
        };

        this.mode = editor.getPreview() ? 'preview' : 'edit';

        this.props = [
            'blockRenderMap',
            'blockRendererFn',
            'blockStyleFn',
            'customStyleMap',
            'handleKeyCommand',
            'handlePastedText',
            'keyBindingFn',
            'handleReturn',
            'onTab',
            'toolbar',
            'customView'
        ];

        plugins.map(plugin => {
            if (!plugin) {
                return;
            }
            plugin.setEditor(this.editor);
            plugin.setDraft(Draft);
            this.buildPlugin(plugin.getEditConfig(), this.config.edit);
            this.buildPlugin(plugin.getPreviewConfig(), this.config.preview);
        });

        this.config.edit.compositeDecorator = new this.Draft.CompositeDecorator(this.config.edit.decorators);
        this.config.preview.compositeDecorator = new this.Draft.CompositeDecorator(this.config.preview.decorators);

        this.config.edit.extendedBlockRenderMap = this.Draft.DefaultDraftBlockRenderMap.merge(Immutable.Map(this.config.edit.blockRenderMap));
        this.config.preview.extendedBlockRenderMap = this.Draft.DefaultDraftBlockRenderMap.merge(Immutable.Map(this.config.preview.blockRenderMap));
    }

    buildPlugin(plugin, target) {
        this.props.map(prop => {
            if (_.has(plugin, prop)) {
                const value = plugin[prop];
                if (React.isValidElement(value)) {
                    target[prop].push(value);
                } else if (_.isPlainObject(value)) {
                    _.assign(target[prop], value);
                } else if (_.isFunction(value)) {
                    target[prop].push(value);
                }
            }
        });

        const decorators = _.get(plugin, 'decorators');
        if (decorators) {
            decorators.map(d => {
                target.decorators.push(this.createDecorator(d));
            });
        }
    }

    setPreview(preview) {
        this.mode = preview ? 'preview' : 'edit';
        return this;
    }

    createDecorator(decorator) {
        const draftDecorator = _.clone(decorator);
        if (_.isString(draftDecorator.strategy)) {
            draftDecorator.strategy = (contentBlock, callback, contentState) => {
                contentBlock.findEntityRanges(
                    (character) => {
                        const entityKey = character.getEntity();
                        return entityKey && contentState.getEntity(entityKey).getType().toUpperCase() === decorator.strategy.toUpperCase();
                    },
                    callback
                );
            };
        }
        return draftDecorator;
    }

    getHandleKeyCommandFn() {
        return (command) => {
            let result = false;
            _.each(this.config[this.mode].handleKeyCommand, fn => {
                result = fn(command, this.editor);
                if (result === true) {
                    return false;
                }
            });

            if (!result) {
                const editorState = this.editor.getEditorState();
                const newState = this.Draft.RichUtils.handleKeyCommand(editorState, command);
                if (newState) {
                    this.editor.setEditorState(newState);
                    return true;
                }
            }
            return false;
        };
    }

    getHandleReturnFn() {
        return (e) => {
            let result = false;
            _.each(this.config[this.mode].handleReturn, fn => {
                result = fn(e, this.editor);
                if (result === true) {
                    return false;
                }
            });

            if (result) {
                return true;
            }
        };
    }

    getHandlePastedTextFn() {
        return (text, html) => {
            let result = false;
            _.each(this.config[this.mode].handlePastedText, fn => {
                result = fn(text, html, this.editor);
                if (result === true) {
                    return false;
                }
            });

            if (result) {
                return true;
            }
        };
    }

    getOnTabFn() {
        return (e) => {
            let result = false;
            _.each(this.config[this.mode].onTab, fn => {
                result = fn(e, this.editor);
                if (result === true) {
                    return false;
                }
            });

            if (result) {
                e.stopPropagation();
                return;
            }

            e.stopPropagation();
            this.editor.setEditorState(this.Draft.RichUtils.onTab(e, this.editor.getEditorState(), 4));
        };
    }

    getDecorators() {
        return this.config[this.mode].compositeDecorator;
    }

    getBlockRenderMap() {
        return this.config[this.mode].extendedBlockRenderMap;
    }

    getBlockRendererFn() {
        return (contentBlock) => {
            let renderer = null;
            _.each(this.config[this.mode].blockRendererFn, br => {
                const plugin = br(contentBlock, this.editor);
                if (plugin) {
                    renderer = {
                        component: PluginBlock,
                        editable: false,
                        props: {
                            plugin,
                            editor: this.editor,
                            plugins: this
                        }
                    };
                    return false;
                }
            });
            return renderer;
        };
    }

    getBlockStyleFn() {
        return (contentBlock) => {
            let renderer = null;
            _.each(this.config[this.mode].blockStyleFn, bs => {
                renderer = bs(contentBlock, this.editor);
                if (renderer) {
                    return false;
                }
            });
            return renderer;
        };
    }

    getCustomStyleMap() {
        return this.config[this.mode].customStyleMap;
    }

    getKeyBindingFn() {
        return (e) => {
            let command = null;
            _.each(this.config[this.mode].keyBindingFn, kb => {
                command = kb(e, this.editor);
                if (_.isString(command)) {
                    return false;
                }
            });

            return command || this.Draft.getDefaultKeyBinding(e);
        };
    }

    getToolbarActions() {
        return this.config.edit.toolbar;
    }

    getCustomViews() {
        return this.config[this.mode].customView;
    }
}