export const patternPresets = [
    {
        type: "email",
        name: "Email",
        regex: `^\\w[\\+\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i"
    },
    {
        type: "lowercase",
        name: "Lower case",
        regex: `^([a-z]*)$`,
        flags: ""
    },
    {
        type: "uppercase",
        name: "Upper case",
        regex: `^([A-Z]*)$`,
        flags: ""
    },
    {
        type: "url",
        name: "URL",
        regex: "^((ftp|http|https):\\/\\/)?([a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)+.*)$",
        flags: "i"
    }
];
