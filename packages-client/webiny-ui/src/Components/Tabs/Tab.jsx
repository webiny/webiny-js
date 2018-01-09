import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * Skeleton class for possible future upgrades
 */
class Tab extends Webiny.Ui.Component {

}

Tab.defaultProps = {
    onClick: _.noop
};

export default Webiny.createComponent(Tab, {tab: true});