import React, { Fragment } from "react";

import { Layout } from "./modules/Layout";
import { Navigation } from "./modules/Navigation";
import { Brand } from "./modules/Brand";
import { Search } from "~/modules/Search";
import { UserMenu } from "~/modules/UserMenu";
import { Overlays } from "./modules/Overlays";
import { NotFound } from "./modules/NotFound";
import { Dashboard } from "./modules/Dashboard";

export const RMWC: React.FC = () => {
    return (
        <Fragment>
            <Layout />
            <Dashboard />
            <NotFound />
            <Brand />
            <Navigation />
            <Search />
            <UserMenu />
            <Overlays />
        </Fragment>
    );
};
