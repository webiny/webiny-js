import React from "react";
import { createComponent } from "webiny-client";

class Contact extends React.Component {
    render() {
        const { user, index } = this.props;
        return (
            <li key={user.id}>
                <a href={`/about/${user.id}`}>
                    {index + 1}) {user.email}
                </a>
            </li>
        );
    }
}

export default createComponent(Contact);
