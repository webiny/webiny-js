import React from "react";

class Page extends React.Component {
    render() {
        const { page } = this.props;

        return (
            <div style={{width: 400}}>
                <h2>{page.title}</h2>
                {this.props.children}
            </div>
        );
    }
}

export default Page;
