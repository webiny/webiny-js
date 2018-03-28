import React from 'react';
import _ from 'lodash';
import classSet from "classnames";
import dynamics from 'dynamics.js';
import { createComponent } from 'webiny-app';
import styles from './styles.css';

class GrowlContainer extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            growls: []
        };

        this.dom = {};
        this.addGrowl = this.addGrowl.bind(this);
        this.removeGrowl = this.removeGrowl.bind(this);
        this.removeById = this.removeById.bind(this);
    }

    componentDidMount() {
        this.props.onComponentDidMount(this);
    }

    addGrowl(growl) {
        let growlIndex = -1;
        if (growl.props.id) {
            growlIndex = _.findIndex(this.state.growls, g => g.props.id === growl.props.id);
        }

        if (growlIndex > -1) {
            this.state.growls[growlIndex] = growl;
        } else {
            if (!growl.props.id) {
                growl = React.cloneElement(growl, { id: _.uniqueId('growl-') });
            }
            this.state.growls.push(growl);
        }
        this.setState({ growls: this.state.growls });
        return growl.props.id;
    }

    removeById(id) {
        this.refs[id] && this.removeGrowl(this.refs[id]);
    }

    removeGrowl(growl) {
        const id = growl.props.id;

        dynamics.animate(this.dom[id], {
            opacity: 0
        }, {
            type: dynamics.easeOut,
            duration: 400,
            complete: () => {
                const index = _.findIndex(this.state.growls, item => item.props.id === id);
                this.state.growls.splice(index, 1);
                this.setState({ growls: this.state.growls });
            }
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        return (
            <div className={classSet(styles.growl, styles.topRight)}>
                <div className={styles.notification}/>
                {this.state.growls.map(growl => {
                    return React.cloneElement(growl, {
                        ref: growl.props.id,
                        onRef: ref => this.dom[growl.props.id] = ref,
                        key: growl.props.id,
                        onRemove: this.removeGrowl
                    });
                })}
            </div>
        );
    }
}

GrowlContainer.defaultProps = {
    onComponentDidMount: _.noop
};

export default createComponent(GrowlContainer, { styles });