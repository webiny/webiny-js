// @flow
import {ColumnsContainer} from "webiny-sql-table";

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
    column(column: string): DefaultColumnsContainer {
        super.column(column);
        return this;
    }

    bigInt(size: number): BigIntColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new BigIntColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    blob(): BlobColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new BlobColumn(this.name, this));
        return table.getColumn(this.name);
    }

    char(size: number): CharColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new CharColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    date(): DateColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new DateColumn(this.name, this));
        return table.getColumn(this.name);
    }

    dateTime(): DateTimeColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new DateTimeColumn(this.name, this));
        return table.getColumn(this.name);
    }

    decimal(size: number, d: number): DecimalColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new DecimalColumn(this.name, this), size, d);
        return table.getColumn(this.name);
    }

    double(size: number, d: number): DoubleColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new DoubleColumn(this.name, this), size, d);
        return table.getColumn(this.name);
    }

    enum(): EnumColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new EnumColumn(this.name, this, Array.from(arguments)));
        return table.getColumn(this.name);
    }

    float(size: number, d: number): FloatColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new FloatColumn(this.name, this), size, d);
        return table.getColumn(this.name);
    }

    int(size: number): IntColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new IntColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    longBlob(): LongBlobColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new LongBlobColumn(this.name, this));
        return table.getColumn(this.name);
    }

    longText(): LongTextColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new LongTextColumn(this.name, this));
        return table.getColumn(this.name);
    }

    mediumBlob(): MediumBlobColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new MediumBlobColumn(this.name, this));
        return table.getColumn(this.name);
    }

    mediumInt(size: number): MediumIntColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new MediumIntColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    mediumText(): MediumTextColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new MediumTextColumn(this.name, this));
        return table.getColumn(this.name);
    }

    smallInt(size: number): SmallIntColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new SmallIntColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    text(): TextColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new TextColumn(this.name, this));
        return table.getColumn(this.name);
    }

    time(): TimeColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new TimeColumn(this.name, this));
        return table.getColumn(this.name);
    }

    timestamp(): TimestampColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new TimestampColumn(this.name, this));
        return table.getColumn(this.name);
    }

    tinyInt(size: number): TinyIntColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new TinyIntColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    tinyText(): TinyTextColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new TinyTextColumn(this.name, this));
        return table.getColumn(this.name);
    }

    varChar(size: number): VarCharColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new VarCharColumn(this.name, this, size));
        return table.getColumn(this.name);
    }

    year(): YearColumn {
        const table = this.getParentTable();
        table.setColumn(this.name, new YearColumn(this.name, this));
        return table.getColumn(this.name);
    }
}

export default DefaultColumnsContainer;
