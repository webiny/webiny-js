import React from "react";
import ApiContainer from './Components/ApiContainer';
import StaticContainer from './Components/StaticContainer';

const List = (props) => {
    return props.api ? <ApiContainer {...props}/> : <StaticContainer {...props}/>;
};

export default List;