import _ from 'lodash';
import {Webiny} from 'webiny-client';

class Switch extends Webiny.Ui.Component {
}

Switch.defaultProps = {
    value: Webiny.EMPTY,
    renderer() {

        const cases = this.props.children;

        if (!_.isArray(this.props.children) || this.props.children.length === 1) {
            throw Error('Switch component must have at least two cases to check.')
        }

        let defaultRender = null;

        for (let i = 0; i < this.props.children.length; i++) {
            const child = this.props.children[i];
            if (child.type === 'case') {
                const value = _.isFunction(child.props.value) ? child.props.value() : child.props.value;
                if (this.props.value !== Webiny.EMPTY) {
                    if (value === this.props.value) {
                        return child;
                    }
                    continue;
                }
                if (value) {
                    return child;
                }
            }

            if (child.type === 'default') {
                defaultRender = child;
            }
        }

        return defaultRender;
    }
};

export default Switch;