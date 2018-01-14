import React from 'react';
import Component from './../Core/Component';

class Menu extends Component {
}

Menu.defaultProps = {
    id: null,
    label: null,
    icon: null,
    order: 100,
    role: null,
    route: null,
    level: 0,
    overwriteExisting: false,
    apps: []
};

export default Menu;