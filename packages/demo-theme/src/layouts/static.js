// @flow
import * as React from "react";
import styled from "react-emotion";
import { Menu } from "webiny-app-cms/render/components";

const Banner = styled("div")({
    backgroundColor: "#666",
    width: "100%",
    height: 50
});

const Static = ({ children }: *) => {
    return (
        <div className={"static-page-container"}>
            <Menu slug={"demo-menu"}>
                {({ data }) => (
                    <ul>
                        {data.items.map(item => (
                            <li key={item.id}>{item.title}</li>
                        ))}
                    </ul>
                )}
            </Menu>
            <Banner />
            {children}
            <Banner />
        </div>
    );
};

export default {
    name: "static",
    title: "Static page",
    render(content: React.Node) {
        return <Static>{content}</Static>;
    }
};
