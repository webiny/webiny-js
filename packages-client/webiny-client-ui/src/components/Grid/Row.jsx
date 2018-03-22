import React from 'react';
import classSet from 'classnames';

const Row = ({ style, className, children }) => {
    return <div style={style} className={classSet('row', className)}>{children}</div>;
};

export default Row;