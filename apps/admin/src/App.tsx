import React, { useState } from "react";
import { Admin, createComponentPlugin, Dashboard, useSecurity } from "@webiny/app-serverless-cms";
import { FileManagerProvider } from "@webiny/app-file-manager/modules/FileManagerRenderer/FileManagerView";
import { FileDetails } from "@webiny/app-file-manager/components/FileDetails";
import { FileItem } from "@webiny/app-admin/types";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";

const file: FileItem = {
    id: "6594165f40bc350008c74725",
    createdOn: "2023-09-25T16:31:18.415Z",
    savedOn: "2023-09-25T16:31:18.415Z",
    createdBy: {
        id: "6496fbd7d6062300081e4727",
        displayName: "Pavel Denisjuk"
    },
    src: "https://d26watk6chcr2b.cloudfront.net/files/6594165f40bc350008c74725/image-32.jpg",
    location: {
        folderId: "root"
    },
    name: "icon 7.svg",
    key: "6594165f40bc350008c74725/image-32.jpg",
    type: "image/jpeg",
    size: 11026,
    meta: {
        private: false,
        originalKey: "6464cb3925c8e70008ac8c69/icon7.svg"
    },
    tags: [],
    aliases: [],
    accessControl: {
        type: "public"
    },
    extensions: {}
};

const MyDashboard = createComponentPlugin(Dashboard, () => {
    return function MyDashboard() {
        const { identity } = useSecurity();
        const [showDetails, setShowDetails] = useState(false);

        return (
            <h3>
                Hi, {identity?.displayName}!<br />
                <button onClick={() => setShowDetails(true)}>Show File Details</button>
                <FileManagerProvider>
                    <FileDetails
                        loading={false}
                        file={file}
                        onClose={() => setShowDetails(false)}
                        open={showDetails}
                    />
                </FileManagerProvider>
            </h3>
        );
    };
});

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <MyDashboard />
        </Admin>
    );
};
