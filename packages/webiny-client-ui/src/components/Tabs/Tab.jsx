import React from "react";
import _ from 'lodash';
import { Component } from 'webiny-client';

/**
 * Skeleton class for possible future upgrades
 */
@Component({ tab: true })
class Tab extends React.Component {

}

Tab.defaultProps = {
    onClick: _.noop
};

export default Tab;