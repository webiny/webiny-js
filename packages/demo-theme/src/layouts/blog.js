import React from "react";
import styled from "react-emotion";
//import { Menu } from "components/Menu";

const Content = styled("div")({
    padding: "0 50px"
});

const Banner100 = styled("div")({
    backgroundColor: "#bb3825",
    width: "100%",
    height: 100
});

/*const Menu = () => {
    return null;
};*/

const Blog = ({ children }) => {
    return (
        <div className={"blog-page-container"}>
            {/*<Menu name={"main"}>
                {data => (
                    <ul>
                        {data.map(item => <li key={item.id}>{item.title}</li>)}
                    </ul>
                )}
            </Menu>*/}
            <Banner100/>
            <Content>{children}</Content>
            <Banner100/>
        </div>
    )
};

export default {
    name: "blog",
    title: "Blog",
    render(content: React.Node) {
        return <Blog>{content}</Blog>;
    }
};