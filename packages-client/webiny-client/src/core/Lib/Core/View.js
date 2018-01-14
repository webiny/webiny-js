import _ from 'lodash';
import Component from './Component';

class View extends Component {

    constructor(props) {
        super(props);
    }
}

View.defaultProps = _.merge({}, Component.defaultProps);

export default View;
