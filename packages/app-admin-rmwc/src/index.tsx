import React, { Fragment } from "react";

import { Layout } from "./modules/Layout";
import { Navigation } from "./modules/Navigation";
import { Brand } from "./modules/Brand";
import { Search } from "~/modules/Search";
import { UserMenu } from "~/modules/UserMenu";
import { Overlays } from "./modules/Overlays";
import { NotFound } from "./modules/NotFound";

export const RMWC = () => {
    return (
        <Fragment>
            <Layout />
            <NotFound />
            <Brand />
            <Navigation />
            <Search />
            <UserMenu />
            <Overlays />
        </Fragment>
    );
};
