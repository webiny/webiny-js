import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Draft.Plugins.LinkPlugin
 */
class LinkPlugin extends Webiny.Draft.EntityPlugin {
    constructor(config) {
        super(config);
        this.validate = _.get(config, 'validate', 'required,url');
        this.name = 'link';
        this.entity = 'LINK';
        this.newLink = true;

        this.showDropdown = this.showDropdown.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.removeEntity = this.removeEntity.bind(this);
    }

    removeEntity() {
        super.removeEntity();
        this.dropdown.close();
    }

    showDropdown() {
        const formUi = this.form;
        const editorState = this.editor.getEditorState();
        if (editorState) {
            const contentState = editorState.getCurrentContent();
            const selection = editorState.getSelection();
            const entityKey = this.getEntityKeyForSelection(contentState, selection);
            if (entityKey) {
                this.newLink = false;
                const data = contentState.getEntity(entityKey).get('data');
                formUi && formUi.setModel(data);
            } else {
                this.newLink = true;
                formUi && formUi.resetForm();
            }
        }
    }

    submitForm({model}) {
        const editorState = this.editor.getEditorState();
        if (this.newLink) {
            const newContentState = editorState.getCurrentContent().createEntity(this.entity, 'MUTABLE', model);
            this.insertEntity(newContentState, newContentState.getLastCreatedEntityKey());
        } else {
            const contentState = editorState.getCurrentContent();
            const entityKey = this.getEntityKeyForSelection(contentState, editorState.getSelection());
            const newContentState = contentState.replaceEntityData(entityKey, model);
            this.editor.setEditorState(this.Draft.EditorState.push(editorState, newContentState, 'apply-entity'));
        }

        const formUi = this.form;
        formUi && formUi.resetForm();
        this.dropdown.close();
    }

    getEditConfig() {
        return {
            toolbar: () => {
                const disabled = this.editor.getReadOnly() || (!this.isActive() && this.editor.getEditorState().getSelection().isCollapsed());

                return (
                    <Webiny.Ui.LazyLoad modules={['Form', 'Dropdown', 'Grid', 'Checkbox', 'Input', 'Logic', 'Button', 'Icon']}>
                        {(Ui) => {
                            const props = {
                                disabled,
                                ref: ref => this.dropdown = ref,
                                title: <Ui.Icon icon="fa-link"/>,
                                closeOnClick: false,
                                onShow: this.showDropdown,
                                className: 'toolbar-dropdown'
                            };

                            return (
                                <Ui.Dropdown {...props}>
                                    {() => (
                                        <Ui.Form ref={ref => this.form = ref} onSubmit={this.submitForm}>
                                            {({form}) => {
                                                return (
                                                    <div style={{width: 400}}>
                                                        <Ui.Grid.Row>
                                                            <Ui.Grid.Col xs={12}>
                                                                <Ui.Input
                                                                    name="url"
                                                                    placeholder={Webiny.I18n('Enter a URL')}
                                                                    validate={this.validate}
                                                                    showValidationIcon={false}/>
                                                            </Ui.Grid.Col>
                                                        </Ui.Grid.Row>
                                                        <Ui.Grid.Row>
                                                            <Ui.Grid.Col xs={6}>
                                                                <Ui.Checkbox name="newTab" label={Webiny.I18n('Open in new tab')}/>
                                                            </Ui.Grid.Col>
                                                            <Ui.Grid.Col xs={3} className="no-padding">
                                                                <Ui.Logic.Hide if={() => this.newLink}>
                                                                    <Ui.Button
                                                                        type="secondary"
                                                                        align="right"
                                                                        label={Webiny.I18n('Remove link')}
                                                                        onClick={this.removeEntity}/>
                                                                </Ui.Logic.Hide>
                                                            </Ui.Grid.Col>
                                                            <Ui.Grid.Col xs={3} className="pull-right">
                                                                <Ui.Button
                                                                    type="primary"
                                                                    label={this.newLink ? 'Insert' : 'Update'}
                                                                    onClick={form.submit}/>
                                                            </Ui.Grid.Col>
                                                        </Ui.Grid.Row>
                                                    </div>
                                                );
                                            }}
                                        </Ui.Form>
                                    )}
                                </Ui.Dropdown>
                            );
                        }}
                    </Webiny.Ui.LazyLoad>
                );
            },
            handleKeyCommand: (command) => {
                if (command === this.entity && this.editor.getEditorState().getSelection().isCollapsed()) {
                    return true;
                }
            },
            decorators: [
                {
                    strategy: this.entity,
                    component: (props) => {
                        const editorState = this.editor.getEditorState();
                        const data = editorState.getCurrentContent().getEntity(props.entityKey).getData();
                        // To avoid opening the link in same tab while editing we always set _blank here
                        return (
                            <a href={data.url} target="_blank">{props.children}</a>
                        );
                    }
                }
            ]
        };
    }

    getPreviewConfig() {
        return {
            decorators: [
                {
                    strategy: this.entity,
                    component: (props) => {
                        const editorState = this.editor.getEditorState();
                        const data = editorState.getCurrentContent().getEntity(props.entityKey).getData();
                        return (
                            <a href={data.url} target={_.get(data, 'newTab') ? '_blank' : '_self'}>{props.children}</a>
                        );
                    }
                }
            ]
        };
    }
}

export default LinkPlugin;