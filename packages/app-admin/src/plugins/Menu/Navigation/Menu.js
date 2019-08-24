// @flow
import * as React from "react";

export type Props = {
    id: ?string,
    label: ?string,
    icon: ?string,
    order: ?number,
    role: ?string,
    path: ?string,
    level: ?number,
    overwriteExisting: ?boolean,
    render: ?Function,
    children: ?React.Node
};

class Menu extends React.Component<Props> {
    static defaultProps = {
        id: null,
        label: null,
        icon: null,
        order: 100,
        role: null,
        path: null,
        level: 0,
        overwriteExisting: false
    };

    render() {
        if (this.props.render) {
            return this.props.render(this);
        }

        return null;
    }
}

export default Menu;
