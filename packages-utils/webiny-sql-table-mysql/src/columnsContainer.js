// @flow
import { ColumnsContainer } from "webiny-sql-table";

import {
    BigIntColumn,
    BlobColumn,
    CharColumn,
    DateColumn,
    DateTimeColumn,
    DecimalColumn,
    DoubleColumn,
    EnumColumn,
    FloatColumn,
    IntColumn,
    LongBlobColumn,
    LongTextColumn,
    MediumBlobColumn,
    MediumIntColumn,
    MediumTextColumn,
    SmallIntColumn,
    TextColumn,
    TimeColumn,
    TimestampColumn,
    TinyIntColumn,
    TinyTextColumn,
    VarCharColumn,
    YearColumn
} from "./columns";

/**
 * Contains basic columns. If needed, this class can be extended to add additional columns,
 * and then be set as a new columns container as the default one.
 */
class DefaultColumnsContainer extends ColumnsContainer {
    bigInt(): BigIntColumn {
        const column = new BigIntColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    blob(): BlobColumn {
        const column = new BlobColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    char(): CharColumn {
        const column = new CharColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    date(): DateColumn {
        const column = new DateColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    dateTime(): DateTimeColumn {
        const column = new DateTimeColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    decimal(): DecimalColumn {
        const column = new DecimalColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    double(): DoubleColumn {
        const column = new DoubleColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    enum(): EnumColumn {
        const column = new EnumColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    float(): FloatColumn {
        const column = new FloatColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    int(): IntColumn {
        const column = new IntColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    longBlob(): LongBlobColumn {
        const column = new LongBlobColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    longText(): LongTextColumn {
        const column = new LongTextColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    mediumBlob(): MediumBlobColumn {
        const column = new MediumBlobColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    mediumInt(): MediumIntColumn {
        const column = new MediumIntColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    mediumText(): MediumTextColumn {
        const column = new MediumTextColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    smallInt(): SmallIntColumn {
        const column = new SmallIntColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    text(): TextColumn {
        const column = new TextColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    time(): TimeColumn {
        const column = new TimeColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    timestamp(): TimestampColumn {
        const column = new TimestampColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    tinyInt(): TinyIntColumn {
        const column = new TinyIntColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    tinyText(): TinyTextColumn {
        const column = new TinyTextColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    varChar(): VarCharColumn {
        const column = new VarCharColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }

    year(): YearColumn {
        const column = new YearColumn(this.newColumnName, this, Array.from(arguments));
        this.columns.push(column);
        return column;
    }
}

export default DefaultColumnsContainer;
