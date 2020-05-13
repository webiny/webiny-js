import React from "react";
import Input from "./Input";
import Select from "./Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { UTC_TIMEZONES } from './utils'

const DEFAULT_TIME = "00:00:00"
const DEFAULT_DATE = "";
const DEFAULT_TIMEZONE = "+01:00";

const DateTimeWithTimezone = (props) => {
  // "2020-05-18T09:00+10:00"
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [timezone, setTimezone] = React.useState("")

  React.useEffect(() => {
    if (props.bind.value === null) {
      // Set initial values
      setDate(DEFAULT_DATE)
      setTime(DEFAULT_TIME)
      setTimezone(DEFAULT_TIMEZONE)
      return
    }
    const [isoDate, rest] = props.bind.value.split('T')
    const sign = rest.includes('+') ? '+' : '-'
    const [fullTime, zone] = rest.split(sign)

    const formattedDate = isoDate
    const formattedTime = fullTime
    const formattedTimezone = sign + zone

    // Set previously saved values
    if (date !== formattedDate) {
      setDate(formattedDate)
    }
    if (time !== formattedTime) {
      setTime(formattedTime)
    }
    if (timezone !== formattedTimezone) {
      setTimezone(formattedTimezone)
    }
  }, [props.bind.value])

  return (
    <Grid>
      <Cell span={4}>
        <Input
          {...props}
          bind={{
            ...props.bind,
            value: date,
            onChange: value => {
              setDate(value);
              return props.bind.onChange(`${value}T${time}${timezone}`);
            }
          }}

          type={"date"} />
      </Cell>
      <Cell span={4}>
        <Input
          {...props}
          bind={{
            ...props.bind,
            value: time,
            onChange: value => {
              // FIXME: better input handling
              setTime(`${value}:00`);
              return props.bind.onChange(`${date}T${value}:00${timezone}`);
            }
          }}

          type={"time"} />
      </Cell>
      <Cell span={4}>
        <Select
          {...props}
          bind={{
            ...props.bind,
            value: timezone,
            onChange: value => {
              setTimezone(value);
              return props.bind.onChange(`${date}T${time}${value}`);
            }
          }}
          field={{
            ...props.field,
            label: null, // TODO: Add relevant Icon or label
            options: [
              ...UTC_TIMEZONES.map(t => ({
                value: t.value,
                label: { values: [{ value: t.label, locale: "5eb7e468d4955f0008b58fdb" }] },
              })),
            ]
          }}
        />
      </Cell>
    </Grid>
  )
}


export default DateTimeWithTimezone;