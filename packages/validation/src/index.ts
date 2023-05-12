import Validation from "./validation";
import ValidationError from "./validationError";
import creditCard from "./validators/creditCard";
import email from "./validators/email";
import eq from "./validators/eq";
import gt from "./validators/gt";
import gte from "./validators/gte";
import isIn from "./validators/in";
import integer from "./validators/integer";
import json from "./validators/json";
import lt from "./validators/lt";
import lte from "./validators/lte";
import maxLength from "./validators/maxLength";
import minLength from "./validators/minLength";
import number from "./validators/number";
import numeric from "./validators/numeric";
import password from "./validators/password";
import phone from "./validators/phone";
import required from "./validators/required";
import url from "./validators/url";
import dateGte from "./validators/dateGte";
import dateLte from "./validators/dateLte";
import timeGte from "./validators/timeGte";
import timeLte from "./validators/timeLte";
import slug from "./validators/slug";

const validation = new Validation();
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

export { validation, Validation, ValidationError };
