import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';
import EntityBox from './AccessBox/EntityBox';
import AddEntityModal from './AddEntityModal';

/**
 * @i18n.namespace Webiny.Backend.Acl.EntityPermissions
 */
class EntityPermissions extends Webiny.Ui.Component {
    constructor() {
        super();
        this.state = {
            entities: [],
            loading: false
        };

        this.api = new Webiny.Api.Endpoint('/entities/webiny/user-permissions');
    }

    componentWillMount() {
        super.componentWillMount();
        if (!_.isEmpty(this.props.model.permissions)) {
            this.setState({loading: true}, () => {
                this.api.setQuery({classIds: _.map(this.props.model.permissions , 'classId')}).get('/entity').then(apiResponse => {
                    this.setState({loading: false, entities: apiResponse.getData()})
                });
            });
        }
    }
}

EntityPermissions.defaultProps = {
    model: null,
    onTogglePermission: _.noop,
    onAddEntity: _.noop,
    onRemoveEntity: _.noop,
    renderer() {
        const {Loader, Button, ViewSwitcher, Grid, Icon, permissions} = this.props;

        return (
            <ViewSwitcher>
                <ViewSwitcher.View view="form" defaultView>
                    {({showView}) => (
                        <div className={styles.entityPermissionsWrapper}>
                            {this.state.loading && <Loader/>}
                            <Grid.Row className={styles.addAction}>
                                <Grid.Col all={12} className="text-center">
                                    <Button type="primary" onClick={showView('addEntityModal')}>
                                        <Icon icon="icon-plus-circled"/>
                                        {this.i18n(`Add entity`)}
                                    </Button>
                                </Grid.Col>
                            </Grid.Row>

                            {_.isEmpty(this.state.entities) ? (
                                <Grid.Row>
                                    <Grid.Col all={12} className="text-center">
                                        <div>
                                            <h2>{this.i18n(`No entities selected.`)}</h2>
                                            <p>
                                                {this.i18n(`To manage access, please add an entity first.`)}
                                            </p>
                                        </div>
                                    </Grid.Col>
                                </Grid.Row>
                            ) : (
                                <Grid.Row className={styles.accessBoxesWrapper}>
                                    {this.state.entities.map(entity => {
                                        const entityPermissions = _.find(this.props.model.permissions, {classId: entity.classId});
                                        return (
                                            <EntityBox
                                                currentlyEditingPermission={this.props.model}
                                                onTogglePermission={(entity, method) => this.props.onTogglePermission(entity, method)}
                                                onRemoveEntity={entity => {
                                                    const index = _.findIndex(this.state.entities, {classId: entity.classId});
                                                    const entities = _.clone(this.state.entities);
                                                    entities.splice(index, 1);
                                                    this.setState({entities}, () => {
                                                        this.props.onRemoveEntity(entity);
                                                        Webiny.Growl.success(this.i18n('Entity removed successfully!'));
                                                    });
                                                }}
                                                key={entity.classId}
                                                entity={entity}
                                                permissions={_.get(entityPermissions, 'rules', {})}/>
                                        );
                                    })}
                                </Grid.Row>
                            )}
                        </div>
                    )}
                </ViewSwitcher.View>
                <ViewSwitcher.View view="addEntityModal" modal>
                    {() => (
                        <AddEntityModal
                            exclude={this.state.entities}
                            onSubmit={entity => {
                                this.setState({entities: _.clone(this.state.entities).concat([entity])}, () => {
                                    this.props.onAddEntity(entity);
                                    Webiny.Growl.success(this.i18n('Entity was added successfully!'));
                                });
                            }}/>
                    )}
                </ViewSwitcher.View>
            </ViewSwitcher>
        );
    }
};

export default Webiny.createComponent(EntityPermissions, {
    modules: [
        'Input', 'Button', 'ViewSwitcher', 'Grid', 'Icon', 'Loader'
    ]
});
