import React from "react";
import { draftMode } from "next/headers";
import "./globals.css";
import { ContentSdkInitializer } from "@/webiny/ContentSdkInitializer";

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { isEnabled } = await draftMode();

    return (
        <html lang="en">
            <head>
                <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
            </head>
            <body>
                <ContentSdkInitializer draftMode={isEnabled} />
                {children}
            </body>
        </html>
    );
}
