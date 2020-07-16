import React from "react";

export default {
    name: "utility-plugins-remove-vowels",
    type: "utility-plugins",
    removeVowels: str => {
        return str.replace(/[aeiouAEIOU]/g, "");
    }
};
