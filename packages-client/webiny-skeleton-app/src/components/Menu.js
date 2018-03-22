import React from "react";

class Menu extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render(this);
        }

        return null;
    }
}

Menu.defaultProps = {
    id: null,
    label: null,
    icon: null,
    order: 100,
    role: null,
    route: null,
    level: 0,
    overwriteExisting: false
};

export default Menu;
