import React from "react";
import Contact from "./Contact";
import { createComponent, LazyLoad, ApiComponent } from "webiny-client";

class About extends React.Component {
    constructor() {
        super();
        this.state = {};
    }

    async componentWillMount() {
        const response = await this.props.api.request();

        this.setState({ users: response.data.data });
    }

    render() {
        return (
            <div>
                <h1>Our team</h1>
                <a href={"/"}>Homepage</a>
                <LazyLoad modules={["CustomUI"]}>{({ CustomUI }) => <CustomUI />}</LazyLoad>
                <ul>
                    {this.state.users &&
                        this.state.users.list.map((user, i) => {
                            return <Contact key={user.id} user={user} index={i} />;
                        })}
                </ul>
            </div>
        );
    }
}

export default createComponent([About, ApiComponent]);
