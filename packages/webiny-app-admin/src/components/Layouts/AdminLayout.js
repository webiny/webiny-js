// @flow
import * as React from "react";
import { Plugins } from "webiny-app/components";

const AdminLayout = ({ children }: { children: React.Node }) => {
    return <Plugins type={"layout"} params={{ content: children }} />;
};

export default AdminLayout;
