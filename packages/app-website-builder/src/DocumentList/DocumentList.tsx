import React from "react";
import { Layout } from "~/DocumentList/components/Layout/index.js";
import { Main } from "~/DocumentList/components/Main/index.js";
import { Sidebar } from "~/DocumentList/components/Sidebar/index.js";

export const DocumentList = () => {
    return <Layout main={<Main />} sidebar={<Sidebar />} />;
};
