import i18n from "./../src";
import defaultProcessor from "./../src/processors/default";

i18n.registerProcessor(defaultProcessor);

const t = i18n.namespace("Random.Namespace");

let text = null;

// With below given format (no timezone), Date assumes passed value is in current timezone.
const april1st2018 = new Date("April 1, 2018 02:00:00");

describe("modifiers test", () => {
    test("count modifier", () => {
        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 1
        });
        expect(text).toEqual("I see 1 bird in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 6
        });
        expect(text).toEqual("I see 6 birds in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 0
        });
        expect(text).toEqual("I see 0 birds in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 2
        });
        expect(text).toEqual("I see 2 birdies in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 4
        });
        expect(text).toEqual("I see 4 birdies in the sky.");

        text = t("I see {numberOfBirds|count:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 5
        });
        expect(text).toEqual("I see 5 birdies in the sky.");

        text = t("I see {numberOfBirds|count:1:bird} in the sky.")({ numberOfBirds: 5 });
        expect(text).toEqual("I see 5 in the sky.");
    });

    test("plural modifier", () => {
        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 1
        });
        expect(text).toEqual("I see bird in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 6
        });
        expect(text).toEqual("I see birds in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 0
        });
        expect(text).toEqual("I see birds in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 2
        });
        expect(text).toEqual("I see birdies in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 4
        });
        expect(text).toEqual("I see birdies in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird:2-5:birdies:default:birds} in the sky.")({
            numberOfBirds: 5
        });
        expect(text).toEqual("I see birdies in the sky.");

        text = t("I see {numberOfBirds|plural:1:bird} in the sky.")({ numberOfBirds: 5 });
        expect(text).toEqual("I see  in the sky.");
    });

    test("date modifier", () => {
        text = t("Today is {today|date}.")({ today: april1st2018 });
        expect(text).toEqual("Today is 01/04/2018.");
    });

    test("datetime modifier", () => {
        text = t("Now it is {today|dateTime}.")({ today: april1st2018 });
        expect(text).toEqual("Now it is 01/04/2018 02:00.");
    });

    test("time modifier", () => {
        text = t("Now it is {today|time}.")({ today: april1st2018 });
        expect(text).toEqual("Now it is 02:00.");
    });

    test("gender modifier", () => {
        text = t("This is {userGender|gender:his:her} pen.")({ userGender: "male" });
        expect(text).toEqual("This is his pen.");

        text = t("This is {userGender|gender:his:her} pen.")({ userGender: "female" });
        expect(text).toEqual("This is her pen.");
    });

    test("if modifier", () => {
        text = t("This is {userGender|if:male:his:her} pen.")({ userGender: "male" });
        expect(text).toEqual("This is his pen.");

        text = t("This is {userGender|if:male:his:her} pen.")({ userGender: "female" });
        expect(text).toEqual("This is her pen.");
    });

    test("number modifier", () => {
        text = t("Number of downloads: {downloads|number}.")({ downloads: 5000000 });
        expect(text).toEqual("Number of downloads: 5,000,000.00.");
    });

    test("price modifier", () => {
        text = t("Item price: {itemPrice|price}.")({ itemPrice: 100 });
        expect(text).toEqual("Item price: 100.00.");
    });
});
