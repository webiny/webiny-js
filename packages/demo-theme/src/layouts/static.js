import React from "react";
import styled from "react-emotion";
//import { Menu } from "components/Menu";

const Banner = styled("div")({
    backgroundColor: "#666",
    width: "100%",
    height: 50
});

/*const Menu = () => {
    return null;
};*/

const Static = ({ children }) => {
    return (
        <div className={"static-page-container"}>
            {/*<Menu name={"main"}>
                {data => (
                    <ul>
                        {data.map(item => <li key={item.id}>{item.title}</li>)}
                    </ul>
                )}
            </Menu>*/}
            <Banner/>
            {children}
            <Banner/>
        </div>
    )
};

export default {
    name: "static",
    title: "Static page",
    component: Static,
};