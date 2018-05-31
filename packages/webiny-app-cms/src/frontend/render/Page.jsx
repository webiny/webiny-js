import React from "react";

class Page extends React.Component {
    render() {
        const { page } = this.props;

        return (
            <div
                style={{
                    margin: "0 auto",
                    width: 700
                }}
            >
                <h2>{page.title}</h2>
                {this.props.children}
            </div>
        );
    }
}

export default Page;
