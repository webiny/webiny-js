import extractor from "./../src";
import mock from "./mock";

describe("extracting values test", () => {
    test("should return regular root keys", async () => {
        const extracted = await extractor.get(mock, "firstName,lastName,enabled");
        expect(extracted.firstName).toEqual("John");
        expect(extracted.lastName).toEqual("Doe");
        expect(extracted.enabled).toEqual(true);
    });

    test("should return nested keys - marked with dots", async () => {
        const extracted = await extractor.get(
            mock,
            "subscription.name,subscription.price,subscription.commitment.expiresOn"
        );
        expect(extracted.subscription.name).toEqual("Free");
        expect(extracted.subscription.price).toEqual(0);
        expect(extracted.subscription.commitment.expiresOn).toEqual("never");
    });

    test("should return nested keys in square brackets", async () => {
        const extracted = await extractor.get(mock, "company[name,city]");
        expect(extracted.company.name).toEqual("Webiny LTD");
        expect(extracted.company.city).toEqual("London");
    });

    test("should return more values that were passed after the square brackets (let's make sure internal character counters work)", async () => {
        const extracted = await extractor.get(mock, "company[name,city],firstName,lastName");
        expect(extracted).toEqual({
            company: {
                name: "Webiny LTD",
                city: "London"
            },
            firstName: "John",
            lastName: "Doe"
        });
    });

    test("should return whole object if nested nested keys aren't set", async () => {
        const extracted = await extractor.get(mock, `company[name,city,image]`);
        expect(extracted).toEqual({
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: {
                        width: 12.5,
                        height: 44
                    },
                    visible: false
                }
            }
        });
    });

    test("if a key is an array and no nested keys are set, it should be returned completely", async () => {
        const extracted = await extractor.get(mock, `age,meta.objects`);
        expect(extracted.age).toEqual(30);
        expect(Array.isArray(extracted.meta.objects)).toBe(true);
        expect(extracted.meta.objects.length).toBe(3);
    });

    test("should support listing paths in multiple lines and return complete data with all nested keys", async () => {
        const extracted = await extractor.get(
            mock,
            `
                 firstName,lastName,enabled,
                 subscription.name,subscription.price,
                 company[name,city,image],
                 age
            `
        );

        expect(extracted.company.name).toEqual("Webiny LTD");
        expect(extracted.company.city).toEqual("London");
        expect(Object.keys(extracted)).toEqual([
            "firstName",
            "lastName",
            "enabled",
            "subscription",
            "company",
            "age"
        ]);
        expect(Object.keys(extracted.company)).toEqual(["name", "city", "image"]);
    });

    test("should correctly receive value that was returned async", async () => {
        const extracted = await extractor.get(mock, `promised`);

        expect(Object.keys(extracted)).toEqual(["promised"]);
        expect(extracted.promised).toEqual(100);
    });

    test("should not include fields that do not exist", async () => {
        const extracted = await extractor.get(
            mock,
            `
			firstName,middleName,lastName,
			company.name,company.name1,company.image.size.something,
			subscription[basicName,name,commitment[something]],
		`
        );

        expect(extracted).toEqual({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Webiny LTD",
                image: {
                    size: {}
                }
            },
            subscription: {
                name: "Free",
                commitment: {}
            }
        });
    });

    test("array tests - should correctly return keys if arrays are present in the path", async () => {
        let extracted = await extractor.get(mock, "meta.objects");
        expect(extracted.meta.objects).toEqual(mock.meta.objects);
        expect(Object.keys(extracted.meta)).toEqual(["objects"]);

        extracted = await extractor.get(mock, "meta.objects.type");
        expect(extracted).toEqual({
            meta: {
                objects: [{ type: "cube" }, { type: "sphere" }, { type: "pyramid" }]
            }
        });

        extracted = await extractor.get(
            mock,
            "meta.objects.type,meta.objects.size,meta.objects.weight"
        );

        expect(extracted).toEqual({
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

    test("array tests - extraction must work correctly with square brackets", async () => {
        let extracted = await extractor.get(mock, "meta.objects[type,size,weight]");

        expect(extracted).toEqual({
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

        expect(extracted).toEqual({
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

    test("array tests - extraction must work with deeply nested arrays", async () => {
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

        expect(extracted).toEqual(expectedResult);
        expect(extractedWithBraces).toEqual(expectedResult);
    });

    test("array tests - extraction must work correctly with square brackets", async () => {
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

        expect(extract1).toEqual(expectedResult);
        expect(extract2).toEqual(expectedResult);
        expect(extract3).toEqual(expectedResult);
        expect(extract4).toEqual(expectedResult);
        expect(extract5).toEqual(expectedResult);
    });

    test("should return undefined fields too, if includeUndefined flag was set", async () => {
        const extract = await extractor.get(
            {
                firstName: "Tom",
                lastName: "Doe",
                age: 30
            },
            "firstName,llastName,ager",
            { includeUndefined: true }
        );

        expect(extract).toEqual({
            firstName: "Tom",
            llastName: undefined,
            ager: undefined
        });
    });

    test("should work even if empty data was sent", async () => {
        const extract = await extractor.get(null);
        expect(extract).toEqual({});
    });

    test("should work when getting values from arrays", async () => {
        let extract = await extractor.get(mock, "simpleList");
        expect(extract).toEqual({ simpleList: ["one", "two", "three", "four"] });

        extract = await extractor.get(mock, "simpleCollection.id,simpleCollection.name");
        expect(extract).toEqual({
            simpleCollection: [
                { id: 1, name: "one" },
                { id: 2, name: "two" },
                { id: 3, name: "three" },
                { id: 4, name: "four" }
            ]
        });
    });

    test("should handle empty values correctly", async () => {
        let extract = await extractor.get(null, "nullValue");
        expect(extract).toEqual({});

        extract = await extractor.get(true, "nullValue");
        expect(extract).toEqual({});

        extract = await extractor.get(false, "nullValue");
        expect(extract).toEqual({});

        extract = await extractor.get(null, "something.nullValue");
        expect(extract).toEqual({});

        extract = await extractor.get({ age: 30, nullValue: null }, "nullValue.empty,test,age");
        expect(extract).toEqual({ age: 30, nullValue: null });
    });

    test("__process should be able to process empty data", async () => {
        const extract = await extractor.__process({});
        expect(extract).toEqual({
            output: {},
            processed: {
                characters: 0
            }
        });
    });

    test("__modifyOutput should be able to process empty data", async () => {
        const extract = await extractor.__modifyOutput();
        expect(extract).not.toBeDefined();
    });
    test("__modifyOutput should be able to process empty data", async () => {
        const extract = await extractor.__modifyOutput();
        expect(extract).not.toBeDefined();
    });
});
