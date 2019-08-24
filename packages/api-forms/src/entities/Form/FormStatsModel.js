import { Model } from "@webiny/model";

class FormStatsModel extends Model {
    views: number;
    submissions: number;
    conversionRate: number;

    constructor() {
        super();
        this.attr("views")
            .integer()
            .setDefaultValue(0);
        this.attr("submissions")
            .integer()
            .setDefaultValue(0);
        this.attr("conversionRate")
            .float()
            .setDynamic(() => {
                if (this.views > 0) {
                    return ((this.submissions / this.views) * 100).toFixed(2);
                }
                return 0;
            });
    }

    incrementViews() {
        this.views++;
    }

    incrementSubmissions() {
        this.submissions = this.submissions + 1;
    }
}

export default FormStatsModel;
