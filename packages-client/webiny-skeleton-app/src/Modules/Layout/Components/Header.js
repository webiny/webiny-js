import React from 'react';
import {Webiny} from 'webiny-client';

const Header = (props) => {
    return React.createElement(props.header);
};


export default Webiny.createComponent(Header, {modules: [{header: 'Webiny/Skeleton/Header'}]});