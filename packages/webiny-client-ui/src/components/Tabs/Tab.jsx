import React from "react";
import _ from 'lodash';
import { inject } from 'webiny-client';

/**
 * Skeleton class for possible future upgrades
 */
@inject({ tab: true })
class Tab extends React.Component {

}

Tab.defaultProps = {
    onClick: _.noop
};

export default Tab;