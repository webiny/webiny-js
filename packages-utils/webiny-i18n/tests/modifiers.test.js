// @flow
import { assert } from "chai";

import { namespace } from "./..";
const t = namespace("Random.Namespace");

let text = null;
const april1st2018 = new Date(1522540800 * 1000);

describe("modifiers test", () => {
    it("count modifier", () => {
        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 1
        });
        assert.equal(text, "I see 1 bird in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 6
        });
        assert.equal(text, "I see 6 birds in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 0
        });
        assert.equal(text, "I see 0 birds in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 2
        });
        assert.equal(text, "I see 2 birdies in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 4
        });
        assert.equal(text, "I see 4 birdies in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 5
        });
        assert.equal(text, "I see 5 birdies in the sky.");

        text = t("I see {numberOfBirds|count:1:bird} in the sky.")({ numberOfBirds: 5 });
        assert.equal(text, "I see 5 in the sky.");
    });

    it("plural modifier", () => {
        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 1
        });
        assert.equal(text, "I see bird in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 6
        });
        assert.equal(text, "I see birds in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 0
        });
        assert.equal(text, "I see birds in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 2
        });
        assert.equal(text, "I see birdies in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 4
        });
        assert.equal(text, "I see birdies in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 5
        });
        assert.equal(text, "I see birdies in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird} in the sky.")({ numberOfBirds: 5 });
        assert.equal(text, "I see  in the sky.");
    });

    it("date modifier", () => {
        text = t("Today is {today|date}.")({ today: april1st2018 });
        assert.equal(text, "Today is 01/04/2018.");
    });

    it("datetime modifier", () => {
        text = t("Now it is {today|dateTime}.")({ today: april1st2018 });
        assert.equal(text, "Now it is 01/04/2018 02:00.");
    });

    it("time modifier", () => {
        text = t("Now it is {today|time}.")({ today: april1st2018 });
        assert.equal(text, "Now it is 02:00.");
    });

    it("gender modifier", () => {
        text = t("This is {userGender|gender:his:her} pen.")({ userGender: "male" });
        assert.equal(text, "This is his pen.");

        text = t("This is {userGender|gender:his:her} pen.")({ userGender: "female" });
        assert.equal(text, "This is her pen.");
    });

    it("if modifier", () => {
        text = t("This is {userGender|if:male:his:her} pen.")({ userGender: "male" });
        assert.equal(text, "This is his pen.");

        text = t("This is {userGender|if:male:his:her} pen.")({ userGender: "female" });
        assert.equal(text, "This is her pen.");
    });

    it("number modifier", () => {
        text = t("Number of downloads: {downloads|number}.")({ downloads: 5000000 });
        assert.equal(text, "Number of downloads: 5,000,000.00.");
    });

    it("price modifier", () => {
        text = t("Item price: {itemPrice|price}.")({ itemPrice: 100 });
        assert.equal(text, "Item price: 100.00.");
    });
});
