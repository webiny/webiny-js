import { assert } from "chai";
import _ from "lodash";

import extractor from "./../src";
import mock from "./mock";

const callback = (data, key) => {
    if (_.isObject(data[key])) {
        return data[key];
    }
    return "___" + data[key] + "___";
};

describe("custom callback test", () => {
    it("should return root keys", async () => {
        let extracted = await extractor.get(mock, "firstName,lastName,age", callback);

        assert.deepEqual(extracted, {
            firstName: "___John___",
            lastName: "___Doe___",
            age: "___30___"
        });
    });

    it("should return nested keys", async () => {
        const extracted = await extractor.get(
            mock,
            "subscription.name,subscription.price,subscription.commitment.expiresOn",
            callback
        );

        assert.deepEqual(extracted, {
            subscription: {
                name: "___Free___",
                price: "___0___",
                commitment: {
                    expiresOn: "___never___"
                }
            }
        });
    });

    it("should return nested keys in square brackets", async () => {
        const extracted = await extractor.get(mock, "company[name,city]", callback);

        assert.deepEqual(extracted, {
            company: {
                name: "___Webiny LTD___",
                city: "___London___"
            }
        });
    });

    it("if a key is an array and no nested keys are set, it should be returned completely", async () => {
        const extracted = await extractor.get(mock, `age,meta.objects`, callback);
        assert.deepEqual(extracted, {
            age: "___30___",
            meta: {
                objects: [
                    {
                        type: "cube",
                        size: "large",
                        weight: "heavy",
                        colors: [
                            {
                                key: "red",
                                label: "Red",
                                comments: [
                                    {
                                        id: 1,
                                        text: "Not bad!",
                                        score: 10
                                    },
                                    {
                                        id: 2,
                                        text: "Red red red",
                                        score: 20
                                    }
                                ]
                            },
                            {
                                key: "blue",
                                label: "Blue",
                                comments: [
                                    {
                                        id: 3,
                                        text: "Like it!",
                                        score: 30
                                    },
                                    {
                                        id: 4,
                                        text: "Blue ocean",
                                        score: 40
                                    },
                                    {
                                        id: 5,
                                        text: "Modern!",
                                        score: 50
                                    }
                                ]
                            },
                            {
                                key: "green",
                                label: "Green",
                                comments: [
                                    {
                                        id: 6,
                                        text: "Nice!",
                                        score: 60
                                    },
                                    {
                                        id: 7,
                                        text: "Too green...",
                                        score: 70
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "sphere",
                        size: "medium",
                        weight: "medium-heavy",
                        colors: [
                            {
                                key: "black",
                                label: "Black",
                                comments: [
                                    {
                                        id: 8,
                                        text: "Looks black enough.",
                                        score: 80
                                    },
                                    {
                                        id: 9,
                                        text: "It is what is is - black is black.",
                                        score: 90
                                    }
                                ]
                            },
                            {
                                key: "white",
                                label: "White",
                                comments: [
                                    {
                                        id: 10,
                                        text: "Looks white enough.",
                                        score: 100
                                    },
                                    {
                                        id: 11,
                                        text: "It is what is is - white is white.",
                                        score: 110
                                    }
                                ]
                            },
                            {
                                key: "gray",
                                label: "Gray",
                                comments: [
                                    {
                                        id: 12,
                                        text: "Looks gray enough.",
                                        score: 120
                                    },
                                    {
                                        id: 13,
                                        text: "It is what is is - gray is gray.",
                                        score: 130
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "pyramid",
                        size: "small",
                        weight: "light",
                        colors: [
                            {
                                key: "purple",
                                label: "Purple",
                                comments: [
                                    {
                                        id: 14,
                                        text: "Looks purple enough.",
                                        score: 140
                                    },
                                    {
                                        id: 15,
                                        text: "It is what is is - purple is purple.",
                                        score: 150
                                    }
                                ]
                            },
                            {
                                key: "orange",
                                label: "Orange",
                                comments: [
                                    {
                                        id: 16,
                                        text: "Looks orange enough.",
                                        score: 160
                                    },
                                    {
                                        id: 17,
                                        text: "It is what is is - orange is orange.",
                                        score: 170
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        });
    });
});
