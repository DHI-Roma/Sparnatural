import { DateTimeValue } from "../../../../../sparql/Query"

export interface ListWidgetValue{
  key:string
  label:string,
  uri:string
}

export interface BooleanWidgetValue {
  key:boolean
  label:string
  boolean:boolean
}

export interface SearchWidgetValue{
  key:string
  label:string
  search:string
}

export interface AutocompleteValue{
  label:string,
  uri:string
}

export interface DateValue {
  label:string
  fromDate: Date
  toDate: Date
}

export interface DateTimePickerValue{
  key:string
  label:string
  start:Date
  stop:Date
}

export interface IWidget {
  html:JQuery<HTMLElement>
  render: ()=>IWidget
  value: ListWidgetValue | DateValue | AutocompleteValue | DateTimePickerValue | SearchWidgetValue | BooleanWidgetValue
}
