import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";
import { useRouter } from "@webiny/react-router";

const Menus = () => {
    const { history } = useRouter();

    return (
        <>
            <SplitView>
                <LeftPanel>
                    <MenusDataList />
                </LeftPanel>
                <RightPanel>
                    <MenusForm />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={() => history.push("/page-builder/menus")} />
        </>
    );
};

export default Menus;
