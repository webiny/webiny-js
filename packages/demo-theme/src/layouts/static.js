// @flow
import * as React from "react";
import styled from "react-emotion";
import { Menu } from "webiny-app-cms/render/components";
import { Addons } from "webiny-app/components";

const Banner = styled("div")({
    backgroundColor: "#666",
    width: "100%",
    height: 50
});

type Props = {
    children: React.Node
};

const Static = ({ children }: Props) => {
    return (
        <div className={"static-page-container"}>
            <Addons />
            <Menu slug={"demo-menu"} component={"default"} />
            <Banner />
            {children}
            <Banner />
        </div>
    );
};

export default Static;
