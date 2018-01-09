import _ from 'lodash';
import {Webiny} from 'webiny-client';
import ApiContainer from './Components/ApiContainer';
import StaticContainer from './Components/StaticContainer';

export default Webiny.createComponent({
    api: ['loadData'],
    getComponent(props) {
        if (_.has(props, 'api') && props.api) {
            return ApiContainer;
        }
        return StaticContainer;
    }
});