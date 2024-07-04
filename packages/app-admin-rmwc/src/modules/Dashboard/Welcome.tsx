import React from "react";

import { Helmet } from "react-helmet";
import { Button } from "@webiny/ui-shadcn";

const Welcome = () => {
    return (
        <>
            <Helmet>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
                    rel="stylesheet"
                />
            </Helmet>
            <Button variant="primary">Button</Button>
        </>
    );
};

export default Welcome;
