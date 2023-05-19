const prev = [
    // Permission 1.
    {
        name: "content.i18n",
        locales: ["en-US"]
    },
    // Permission 2.
    {
        name: "pb.*"
    }
];
// ----------------------------------

// Still array, except it's an array of objects, each object has a locale property.
const next1 = [
    {
        locale: "en-US",
        permissions: [{ name: "pb.X" }, { name: "pb.Y" }]
    }
];

const next2 = { 👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍👍
    "en-US": [{ name: "pb.X" }],
    "en-GB": [{ name: "pb.Y" }]
};
