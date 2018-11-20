// @flow
import * as React from "react";
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


type Props = {
    children: React.Node
};

export default ({ children }: Props) => {
    return (
        <div className={"blog-page-container"}>
            {/*<Menu name={"main"}>
                {({ items }) => (
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