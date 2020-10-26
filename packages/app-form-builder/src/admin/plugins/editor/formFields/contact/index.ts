import firstName from "./firstName";
import lastName from "./lastName";
import email from "./email";
import website from "./website";
import phoneNumber from "./phoneNumber";
import streetAddress from "./streetAddress";
import city from "./city";
import country from "./country";
import stateRegion from "./stateRegion";
import companyName from "./companyName";
import jobTitle from "./jobTitle";
import postCode from "./postCode";
import { FbBuilderFieldPlugin } from "@webiny/app-form-builder/types";

const plugins: FbBuilderFieldPlugin[] = [
    firstName,
    lastName,
    email,
    website,
    phoneNumber,
    streetAddress,
    city,
    country,
    stateRegion,
    companyName,
    jobTitle,
    postCode
];

export default plugins;
