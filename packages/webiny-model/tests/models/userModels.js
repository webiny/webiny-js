import Model from "./../../src/model";

class Size extends Model {
    constructor() {
        super();
        this.attr("height")
            .float()
            .setValidators("required");
        this.attr("width")
            .float()
            .setValidators("required");
    }
}

class Image extends Model {
    constructor() {
        super();
        this.attr("file")
            .char()
            .setValidators("required");
        this.attr("size")
            .model(Size)
            .setValidators("required");
        this.attr("visible")
            .boolean()
            .setDefaultValue(false);
    }
}

class Company extends Model {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("city")
            .char()
            .onGet((value, lowerCase) => {
                if (lowerCase && value) {
                    return value.toLowerCase();
                }
                return value;
            });

        this.attr("image")
            .model(Image)
            .setValidators("required");
    }
}

class User extends Model {
    constructor() {
        super();
        this.attr("firstName")
            .char()
            .setValidators("required");
        this.attr("lastName")
            .char()
            .setValidators("required");
        this.attr("age")
            .integer()
            .onGet((value, operation, number) => {
                if (operation === "add") {
                    return value + Number(number);
                }

                if (operation === "sub") {
                    return value - Number(number);
                }

                return value;
            });
        this.attr("company")
            .model(Company)
            .setValidators("required");
    }
}

export { Size, Image, Company, User };
