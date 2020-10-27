import React, { useMemo } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";
import { useRouter } from "@webiny/react-router";
import { useSecurity } from "@webiny/app-security";

const Categories = () => {
    const { history } = useRouter();

    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.category");
    }, []);

    const canCreate = useMemo(() => {
        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("w");
        }

        return true;
    }, []);

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
            {canCreate && (
                <FloatingActionButton onClick={() => history.push("/page-builder/categories")} />
            )}
        </>
    );
};

export default Categories;
