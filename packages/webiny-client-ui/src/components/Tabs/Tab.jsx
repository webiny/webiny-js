import React from "react";
import _ from 'lodash';
import { createComponent } from 'webiny-client';

/**
 * Skeleton class for possible future upgrades
 */
class Tab extends React.Component {

}

Tab.defaultProps = {
    onClick: _.noop
};

export default createComponent(Tab, { tab: true });