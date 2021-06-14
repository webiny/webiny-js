import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import BooksDataList from "./BooksDataList";
import BooksForm from "./BooksForm";

/**
 * Main view component - renders data list and form.
 */

const BooksView = () => {
    return (
        <SplitView>
            <LeftPanel>
                <BooksDataList />
            </LeftPanel>
            <RightPanel>
                <BooksForm />
            </RightPanel>
        </SplitView>
    );
};

export default BooksView;
