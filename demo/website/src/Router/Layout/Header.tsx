import React from "react";
import { Link } from "@webiny/react-router";

import zeissLogo from "./assets/zeiss-logo.png";

export const Header = () => {
    return (
        <>
            <header className="antialiased">
                <nav className="bg-gray-50 dark:bg-gray-900 fixed w-full z-20 top-0 start-0 p-3 border border-gray-300">
                    <div className="flex flex-wrap justify-center items-center">
                        <div className="flex justify-start items-center">
                            <Link to="/" className="flex mr-4">
                                <img src={zeissLogo} className="mr-3 h-8" alt={"Zeiss"} />
                            </Link>
                        </div>

                        <div className="flex items-center lg:order-2"></div>
                    </div>
                </nav>
            </header>
        </>
    );
};
