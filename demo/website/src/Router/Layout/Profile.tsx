import React from "react";
import { useSecurity } from "@webiny/app-security";
import styled from "@emotion/styled";

const Logout = styled.a`
    color: #fc4f00;
    cursor: pointer;
    :hover {
        text-decoration: underline;
    }
`;

export const Profile = () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    return (
        <div className="px-8">
            <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg className="absolute w-12 h-12 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                </div>
                <div className="font-medium dark:text-white">
                    <div>{identity.displayName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400"><Logout onClick={() => identity.logout()}>logout</Logout></div>
                </div>
            </div>
        </div>
    );
};
