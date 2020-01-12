import React from "react";
import Auth from "@aws-amplify/auth";

class Logout extends React.Component {
    async componentDidMount() {
        await Auth.signOut();
    }

    render() {
        return null;
    }
}

export default Logout;
