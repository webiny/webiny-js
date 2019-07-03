import React from "react";
import { get } from "lodash";

export default function CountryFlag({ locale }) {
    const code = get(locale, "code");
    if (typeof code !== "string") {
        return null;
    }

    const [, country] = code.split("-");

    if (typeof country === "string" && country.length === 2) {
        return <img alt="" src={`https://www.countryflags.io/${country}/flat/24.png`} />;
    }
    return null;
}
