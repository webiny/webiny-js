import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import EntityPermissions from './Components/EntityPermissions';
import ServicePermissions from './Components/ServicePermissions';

/**
 * @i18n.namespace Webiny.Backend.Acl.UserPermissionsForm
 */
class UserPermissionsForm extends Webiny.Ui.View {
    constructor(props) {
        super(props);
        this.state = {};
    }

    onToggle(model, form, classId, method) {
        const pIndex = _.findIndex(model.permissions, {classId});

        const rules = model.permissions[pIndex].rules;
        _.set(rules, method, !_.get(rules, method));

        model.permissions[pIndex].rules = rules;
        form.setState({model});
    }

    onAdd(model, form, resource) {
        model.permissions.push({
            classId: resource.classId,
            rules: {}
        });
        form.setState({model});
    }

    onRemove(model, form, resource) {
        const pIndex = _.findIndex(model.permissions, {classId: resource.classId});
        model.permissions.splice(pIndex, 1);
        form.setState({model});
    }

    renderView(Ui) {
        const newUserPermission = !Webiny.Router.getParams('id');

        return (
            <Ui.Form
                api="/entities/webiny/user-permissions"
                fields="id,name,slug,description,permissions"
                connectToRouter
                onSubmitSuccess="UserPermissions.List"
                onCancel="UserPermissions.List"
                defaultModel={{permissions: []}}
                onSuccessMessage={({model}) => {
                    return <span>{this.i18n('Permission {permission} was saved successfully!', {permission: <strong>{model.name}</strong>})}</span>;

                }}>
                {({model, form}) => {
                    return (
                        <Ui.View.Form>
                            <Ui.View.Header title={model.id ? this.i18n('ACL - Edit permission') : this.i18n('ACL - Create permission')}/>
                            <Ui.View.Body>
                                <Ui.Section title={this.i18n('General')}/>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Input label={this.i18n('Name')} name="name" validate="required"/>
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Input label={this.i18n('Slug')} name="slug"/>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.Input label={this.i18n('Description')} name="description" validate="required"/>
                                        <Ui.Tabs>
                                            <Ui.Tabs.Tab label={this.i18n('Entities')}>
                                                {(newUserPermission || model.id) && (
                                                    <EntityPermissions
                                                        model={model}
                                                        onTogglePermission={(classId, method) => this.onToggle(model, form, classId, method)}
                                                        onAddEntity={resource => this.onAdd(model, form, resource)}
                                                        onRemoveEntity={resource => this.onRemove(model, form, resource)}/>
                                                )}
                                            </Ui.Tabs.Tab>
                                            <Ui.Tabs.Tab label={this.i18n('Services')}>
                                                {(newUserPermission || model.id) && (
                                                    <ServicePermissions
                                                        model={model}
                                                        onTogglePermission={(classId, method) => this.onToggle(model, form, classId, method)}
                                                        onAddService={resource => this.onAdd(model, form, resource)}
                                                        onRemoveService={resource => this.onRemove(model, form, resource)}/>
                                                )}
                                            </Ui.Tabs.Tab>
                                        </Ui.Tabs>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                            </Ui.View.Body>
                            <Ui.View.Footer>
                                <Ui.Button type="default" onClick={form.cancel} label={this.i18n('Go back')}/>
                                <Ui.Button type="primary" onClick={form.submit} label={this.i18n('Save permission')} align="right"/>
                            </Ui.View.Footer>
                        </Ui.View.Form>
                    );
                }}
            </Ui.Form>
        );
    }
}

UserPermissionsForm.defaultProps = {
    renderer() {
        return (
            <Webiny.Ui.LazyLoad
                modules={['Form', 'Section', 'View', 'Grid', 'Tabs', 'Input', 'Label', 'Button', 'Switch']}>
                {Ui => this.renderView(Ui)}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default UserPermissionsForm;
