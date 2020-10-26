import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";
import { useRouter } from "@webiny/react-router";

const Categories = () => {
    const { history } = useRouter();

    return (
        <>
            <SplitView>
                <LeftPanel>
                    <CategoriesDataList />
                </LeftPanel>
                <RightPanel>
                    <CategoriesForm />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={() => history.push("/page-builder/categories")} />
        </>
    );
};

export default Categories;
