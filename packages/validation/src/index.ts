import Validation from "./validation.js";
import ValidationError from "./validationError.js";
import creditCard from "./validators/creditCard.js";
import email from "./validators/email.js";
import eq from "./validators/eq.js";
import gt from "./validators/gt.js";
import gte from "./validators/gte.js";
import isIn from "./validators/in.js";
import integer from "./validators/integer.js";
import json from "./validators/json.js";
import lt from "./validators/lt.js";
import lte from "./validators/lte.js";
import maxLength from "./validators/maxLength.js";
import minLength from "./validators/minLength.js";
import number from "./validators/number.js";
import numeric from "./validators/numeric.js";
import password from "./validators/password.js";
import phone from "./validators/phone.js";
import required from "./validators/required.js";
import url from "./validators/url.js";
import dateGte from "./validators/dateGte.js";
import dateLte from "./validators/dateLte.js";
import timeGte from "./validators/timeGte.js";
import timeLte from "./validators/timeLte.js";
import slug from "./validators/slug.js";

// Testing change.

export const validation = new Validation();

validation.setValidator("creditCard", creditCard);
validation.setValidator("email", email);
validation.setValidator("eq", eq);
validation.setValidator("gt", gt);
validation.setValidator("gte", gte);
validation.setValidator("in", isIn);
validation.setValidator("integer", integer);
validation.setValidator("json", json);
validation.setValidator("lt", lt);
validation.setValidator("lte", lte);
validation.setValidator("maxLength", maxLength);
validation.setValidator("minLength", minLength);
validation.setValidator("number", number);
validation.setValidator("numeric", numeric);
validation.setValidator("password", password);
validation.setValidator("phone", phone);
validation.setValidator("required", required);
validation.setValidator("url", url);
validation.setValidator("dateGte", dateGte);
validation.setValidator("dateLte", dateLte);
validation.setValidator("timeGte", timeGte);
validation.setValidator("timeLte", timeLte);
validation.setValidator("slug", slug);

export { Validation, ValidationError };
