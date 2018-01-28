import { assert } from "chai";

import extractor from "./../src";
import mock from "./mock";

describe("extracting values test", () => {
    it("should return regular root keys", async () => {
        const extracted = await extractor.get(mock, "firstName,lastName,enabled");
        assert.equal(extracted.firstName, "John");
        assert.equal(extracted.lastName, "Doe");
        assert.equal(extracted.enabled, true);
    });

    it("should return nested keys - marked with dots", async () => {
        const extracted = await extractor.get(
            mock,
            "subscription.name,subscription.price,subscription.commitment.expiresOn"
        );
        assert.equal(extracted.subscription.name, "Free");
        assert.equal(extracted.subscription.price, 0);
        assert.equal(extracted.subscription.commitment.expiresOn, "never");
    });

    it("should return nested keys in square brackets", async () => {
        const extracted = await extractor.get(mock, "company[name,city]");
        assert.equal(extracted.company.name, "Webiny LTD");
        assert.equal(extracted.company.city, "London");
    });

    it("should return more values that were passed after the square brackets (let's make sure internal character counters work)", async () => {
        const extracted = await extractor.get(mock, "company[name,city],firstName,lastName");
        assert.deepEqual(extracted, {
            company: {
                name: "Webiny LTD",
                city: "London"
            },
            firstName: "John",
            lastName: "Doe"
        });
    });

    it("should return whole objects if nested keys aren't set", async () => {
        const extracted = await extractor.get(mock, `company[name,city,image]`);

        assert.equal(extracted.company.name, "Webiny LTD");
        assert.equal(extracted.company.city, "London");
        assert.equal(extracted.company.image.file, "webiny.jpg");
        assert.equal(extracted.company.image.size.width, 12.5);
        assert.equal(extracted.company.image.size.height, 44);
        assert.equal(extracted.company.image.visible, false);
        assert.hasAllKeys(extracted.company, ["name", "city", "image"]);
        assert.hasAllKeys(extracted.company.image, ["file", "size", "visible"]);
        assert.hasAllKeys(extracted.company.image.size, ["width", "height"]);
    });

    it("if a key is an array and no nested keys are set, it should be returned completely", async () => {
        const extracted = await extractor.get(mock, `age,meta.objects`);
        assert.equal(extracted.age, 30);
        assert.isArray(extracted.meta.objects);
        assert.lengthOf(extracted.meta.objects, 3);
    });

    it("should support listing paths in multiple lines and return complete data with all nested keys", async () => {
        const extracted = await extractor.get(
            mock,
            `
			 firstName,lastName,enabled,
			 subscription.name,subscription.price,
			 company[name,city,image],
			 age
		`
        );

        assert.equal(extracted.company.name, "Webiny LTD");
        assert.equal(extracted.company.city, "London");
        assert.hasAllKeys(extracted, [
            "age",
            "firstName",
            "lastName",
            "enabled",
            "subscription",
            "company"
        ]);
        assert.hasAllKeys(extracted.company, ["name", "city", "image"]);
    });

    it("should correctly receive value that was returned async", async () => {
        const extracted = await extractor.get(mock, `promised`);

        assert.hasAllKeys(extracted, ["promised"]);
        assert.equal(extracted.promised, 100);
    });

    it("should not include fields that do not exist", async () => {
        const extracted = await extractor.get(
            mock,
            `
			firstName,middleName,lastName,
			company.name,company.name1,company.image.size.something,
			subscription[basicName,name,commitment[something]],
		`
        );

        assert.deepEqual(extracted, {
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Webiny LTD",
                image: {
                    size: {}
                }
            },
            subscription: {
                commitment: {},
                name: "Free"
            }
        });
    });

    it("array tests - should correctly return keys if arrays are present in the path", async () => {
        let extracted = await extractor.get(mock, "meta.objects");
        assert.deepEqual(extracted.meta.objects, mock.meta.objects);
        assert.hasAllKeys(extracted.meta, ["objects"]);

        extracted = await extractor.get(mock, "meta.objects.type");
        assert.deepEqual(extracted, {
            meta: {
                objects: [{ type: "cube" }, { type: "sphere" }, { type: "pyramid" }]
            }
        });

        extracted = await extractor.get(
            mock,
            "meta.objects.type,meta.objects.size,meta.objects.weight"
        );

        assert.deepEqual(extracted, {
            meta: {
                objects: [
                    {
                        type: "cube",
                        size: "large",
                        weight: "heavy"
                    },
                    {
                        type: "sphere",
                        size: "medium",
                        weight: "medium-heavy"
                    },
                    {
                        type: "pyramid",
                        size: "small",
                        weight: "light"
                    }
                ]
            }
        });
    });

    it("array tests - extraction must work correctly with square brackets", async () => {
        let extracted = await extractor.get(mock, "meta.objects[type,size,weight]");

        assert.deepEqual(extracted, {
            meta: {
                objects: [
                    {
                        type: "cube",
                        size: "large",
                        weight: "heavy"
                    },
                    {
                        type: "sphere",
                        size: "medium",
                        weight: "medium-heavy"
                    },
                    {
                        type: "pyramid",
                        size: "small",
                        weight: "light"
                    }
                ]
            }
        });

        extracted = await extractor.get(mock, "meta.objects[type,size,weight,colors.key]");

        assert.deepEqual(extracted, {
            meta: {
                objects: [
                    {
                        type: "cube",
                        size: "large",
                        weight: "heavy",
                        colors: [{ key: "red" }, { key: "blue" }, { key: "green" }]
                    },
                    {
                        type: "sphere",
                        size: "medium",
                        weight: "medium-heavy",
                        colors: [{ key: "black" }, { key: "white" }, { key: "gray" }]
                    },
                    {
                        type: "pyramid",
                        size: "small",
                        weight: "light",
                        colors: [{ key: "purple" }, { key: "orange" }]
                    }
                ]
            }
        });
    });

    it("array tests - extraction must work with deeply nested arrays", async () => {
        const extractedWithBraces = await extractor.get(
            mock,
            "meta.objects[type,size,weight,colors[key,label]]"
        );
        const extracted = await extractor.get(
            mock,
            "meta.objects[type,size,weight,colors.key,colors.label]"
        );

        const expectedResult = {
            meta: {
                objects: [
                    {
                        type: "cube",
                        size: "large",
                        weight: "heavy",
                        colors: [
                            {
                                key: "red",
                                label: "Red"
                            },
                            {
                                key: "blue",
                                label: "Blue"
                            },
                            {
                                key: "green",
                                label: "Green"
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
                                label: "Black"
                            },
                            {
                                key: "white",
                                label: "White"
                            },
                            {
                                key: "gray",
                                label: "Gray"
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
                                label: "Purple"
                            },
                            {
                                key: "orange",
                                label: "Orange"
                            }
                        ]
                    }
                ]
            }
        };

        assert.deepEqual(extracted, expectedResult);
        assert.deepEqual(extractedWithBraces, expectedResult);
    });

    it("array tests - extraction must work correctly with square brackets", async () => {
        const extract1 = await extractor.get(mock, "meta.objects");
        const extract2 = await extractor.get(
            mock,
            "meta.objects[type,size,weight,colors[key,label,comments]]"
        );
        const extract3 = await extractor.get(
            mock,
            "meta.objects[type,size,weight,colors.key,colors.label,colors.comments]"
        );
        const extract4 = await extractor.get(
            mock,
            "meta.objects[type,size,weight,colors.key,colors.label,colors.comments[id,text,score]]"
        );
        const extract5 = await extractor.get(
            mock,
            "meta.objects[type,size,weight,colors.key,colors.label,colors.comments.id,colors.comments.text,colors.comments.score]"
        );

        const expectedResult = { meta: { objects: mock.meta.objects } };

        assert.deepEqual(extract1, expectedResult);
        assert.deepEqual(extract2, expectedResult);
        assert.deepEqual(extract3, expectedResult);
        assert.deepEqual(extract4, expectedResult);
        assert.deepEqual(extract5, expectedResult);
    });

    it("should work even if empty data was sent", async () => {
        const extract = await extractor.get(null);
        assert.deepEqual(extract, {});
    });

    it("__process should be able to process empty data", async () => {
        const extract = await extractor.__process({});
        assert.deepEqual(extract, {
            output: {},
            processed: {
                characters: 0
            }
        });
    });

    it("__modifyOutput should be able to process empty data", async () => {
        const extract = await extractor.__modifyOutput({});
        assert.isUndefined(extract);
    });
});
