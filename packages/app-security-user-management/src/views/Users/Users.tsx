import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import UsersDataList from "./UsersDataList";
import UsersForm from "./UsersForm";
import { useRouter } from "@webiny/react-router";

const Users = () => {
    const { history } = useRouter();
    return (
        <>
            <SplitView>
                <LeftPanel>
                    <UsersDataList />
                </LeftPanel>
                <RightPanel
                    style={{
                        marginLeft: "100px",
                        marginRight: "100px",
                        overflow: "hidden"
                    }}
                >
                    <UsersForm />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => history.push("/security/users")}
            />
        </>
    );
};

export default Users;
