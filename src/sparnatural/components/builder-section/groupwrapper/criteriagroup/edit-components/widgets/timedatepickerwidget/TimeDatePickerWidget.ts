import { Pattern } from "sparqljs";
import tippy from "tippy.js";
import { getSettings } from "../../../../../../../../configs/client-configs/settings";
import AddUserInputBtn from "../../../../../../buttons/AddUserInputBtn";
import InfoBtn from "../../../../../../buttons/InfoBtn";
import WidgetWrapper from "../../WidgetWrapper";
import { AbstractWidget, ValueType, WidgetValue } from "../AbstractWidget";
import "@chenfengyuan/datepicker";
import * as DataFactory from "@rdfjs/data-model" ;
import { SelectedVal } from "../../../../../../../sparql/ISparJson";
import ISpecProvider from "../../../../../../../spec-providers/ISpecProviders";
import SparqlFactory from "../../../../../../../sparql/SparqlFactory";
import { buildDateRangeOrExactDatePattern, buildDateRangePattern } from "./TimeDatePattern";

export interface DateTimePickerValue extends WidgetValue {
  value: {
    key: string;
    label: string;
    start: Date;
    stop: Date;
  };
}

export class TimeDatePickerWidget extends AbstractWidget {
  protected widgetValues: DateTimePickerValue[];
  datesHandler: any;
  ParentComponent: any;
  dateFormat: any;
  inputStart: JQuery<HTMLElement>;
  inputEnd: JQuery<HTMLElement>;
  inputValue: JQuery<HTMLElement>;
  infoBtn: InfoBtn;
  addValueBtn: AddUserInputBtn;
  value: DateTimePickerValue;
  startClassVal: SelectedVal;
  objectPropVal: SelectedVal;
  endClassVal: SelectedVal;
  specProvider: ISpecProvider;

  constructor(
    parentComponent: WidgetWrapper,
    datesHandler: any,
    dateFormat: any,
    startClassCal: SelectedVal,
    objectPropVal: SelectedVal,
    endClassVal: SelectedVal,
    specProvider: ISpecProvider
  ) {
    super(
      "timedatepicker-widget",
      parentComponent,
      null,
      startClassCal,
      objectPropVal,
      endClassVal
    );
    this.datesHandler = datesHandler;
    this.dateFormat = dateFormat;
    this.specProvider = specProvider;
  }

  render() {
    super.render();
    this.html.append(
      $(`<span>${getSettings().langSearch.LabelDateFrom}&nbsp;</span>`)
    );
    this.inputStart = $(
      `<input id="input-start" placeholder="${
        getSettings().langSearch.TimeWidgetDateFrom
      }" autocomplete="off" class="${this.dateFormat}" />`
    );
    this.inputEnd = $(
      `<input id="input-end" placeholder="${
        getSettings().langSearch.TimeWidgetDateTo
      }" autocomplete="off" class="${this.dateFormat}" />`
    );
    this.inputValue = $(`<input id="input-value" type="hidden"/>`);
    let span = $(`<span>&nbsp;${getSettings().langSearch.LabelDateTo}&nbsp;</span>`);
    this.html
      .append(this.inputStart)
      .append(span)
      .append(this.inputEnd)
      .append(this.inputValue);
    // Build datatippy info
    let datatippy =
      this.dateFormat == "day"
        ? getSettings().langSearch.TimeWidgetDateHelp
        : getSettings().langSearch.TimeWidgetYearHelp;
    // set a tooltip on the info circle
    var tippySettings = Object.assign({}, getSettings().tooltipConfig);
    tippySettings.placement = "left";
    tippySettings.trigger = "click";
    tippySettings.offset = [this.dateFormat == "day" ? 75 : 50, -20];
    tippySettings.delay = [0, 0];
    this.infoBtn = new InfoBtn(this, datatippy, tippySettings).render();
    //finish datatippy

    this.addValueBtn = new AddUserInputBtn(
      this,
      getSettings().langSearch.ButtonAdd,
      this.#addValueBtnClicked
    ).render();

    let calendarFormat = 
    (this.dateFormat == "day")
    ? getSettings().langSearch.PlaceholderTimeDateDayFormat
    : getSettings().langSearch.PlaceholderTimeDateFormat;

    var options: {
      language: any;
      autoHide: boolean;
      format: any;
      date: any;
      startView: number;
    } = {
      language: getSettings().langSearch.LangCodeTimeDate,
      autoHide: true,
      format: calendarFormat,
      date: null,
      startView: 2,
    };

    this.inputStart.datepicker(options);
    this.inputEnd.datepicker(options);

    return this;
  }

  #addValueBtnClicked = () => {
    let val = {
      valueType: ValueType.SINGLE,
      value: {
        key: "",
        label: "",
        start: (this.inputStart.val() != '')?new Date(this.inputStart.datepicker("getDate")):null,
        stop: (this.inputEnd.val() != '')?new Date(this.inputEnd.datepicker("getDate")):null,
        startLabel:this.inputStart.val(),
        endLabel:this.inputEnd.val()
      },
    };
    let widgetVal: DateTimePickerValue = this.#validateInput(
      (this.inputStart.val() != '')?new Date(this.inputStart.datepicker("getDate")):null,
      this.inputStart.val(),
      (this.inputEnd.val() != '')?new Date(this.inputEnd.datepicker("getDate")):null,
      this.inputEnd.val()
    );
    if (!widgetVal) return;
    this.renderWidgetVal(widgetVal);
  };

  //TODO add dialog for user if input is unreasonable
  #validateInput(
    startValue: Date,
    startLabel: any,
    endValue: Date,
    endLabel: any
  ) {
    if (
      startValue == null &&
      endValue == null
    ) {
      console.warn(`no input received on DateTimePicker`);
      return null;
    }
    if (startValue && endValue && (startValue > endValue)) {
      console.warn(`startVal is bigger then endVal`);
      return null;
    }

    let tmpValue: { start: Date; stop: Date };

    if (this.dateFormat == "day") {
      tmpValue = {
        start: (startValue)?new Date(startValue.setHours(0, 0, 0, 0)):null,
        stop: (endValue)?new Date(endValue.setHours(23, 59, 59, 59)):null,
      };
    } else {
      tmpValue = {
        start: (startValue)?
        (new Date(
          startValue.getFullYear(),
          0,
          1,
          0,
          0,
          1,
          0
        )) // first day
        :null, 
        stop: (endValue)?
        (new Date(
          endValue.getFullYear(),
          11,
          31,
          23,
          59,
          59
        )) // last day
        :null
      };
    }
    let dateTimePickerVal: DateTimePickerValue = {
      valueType: ValueType.SINGLE,
      value: {
        key: tmpValue.start+" - "+tmpValue.stop,
        // TODO : this is not translated
        label: this.getValueLabel(startLabel, endLabel),
        start: tmpValue.start,
        stop: tmpValue.stop,
      },
    };
    return dateTimePickerVal;
  }

  getValueLabel = function (startLabel: string, stopLabel: string) {
    let valueLabel = "";
    if ((startLabel != "") && (stopLabel != "")) {
      valueLabel = getSettings().langSearch.LabelDateFrom+' '+ startLabel +' '+getSettings().langSearch.LabelDateTo+' '+ stopLabel ;
    } else if (startLabel != "") {
      valueLabel = getSettings().langSearch.DisplayValueDateFrom+' '+ startLabel ;
    } else if (stopLabel != "") {
      valueLabel = getSettings().langSearch.DisplayValueDateTo+' '+ stopLabel ;
    }

    return valueLabel;
  };

  #padTo2Digits(num: number) {
    return num.toString().padStart(2, "0");
  }

  #formatDate(date: Date) {
    return [
      this.#padTo2Digits(date.getDate()),
      this.#padTo2Digits(date.getMonth() + 1),
      date.getFullYear(),
    ].join("/");
  }

  getRdfJsPattern(): Pattern[] {
    let beginDateProp = this.specProvider.getBeginDateProperty(this.objectPropVal.type);
    let endDateProp = this.specProvider.getEndDateProperty(this.objectPropVal.type);

    if(beginDateProp != null && endDateProp != null) {
      let exactDateProp = this.specProvider.getExactDateProperty(this.objectPropVal.type);

      return [
        buildDateRangeOrExactDatePattern(
          this.widgetValues[0].value.start?DataFactory.literal(
            this.widgetValues[0].value.start.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          this.widgetValues[0].value.stop?DataFactory.literal(
            this.widgetValues[0].value.stop.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          DataFactory.variable(
            this.getVariableValue(this.startClassVal)
          ),
          DataFactory.namedNode(beginDateProp),
          DataFactory.namedNode(endDateProp),
          exactDateProp != null?DataFactory.namedNode(exactDateProp):null,
          DataFactory.variable(this.getVariableValue(this.startClassVal))
        ),
      ];
    } else {
      return [
        SparqlFactory.buildFilterTime(
          this.widgetValues[0].value.start?DataFactory.literal(
            this.widgetValues[0].value.start.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          this.widgetValues[0].value.stop?DataFactory.literal(
            this.widgetValues[0].value.stop.toISOString(),
            DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
          ):null,
          DataFactory.variable(
            this.getVariableValue(this.startClassVal)
          )
        ),
      ];
    }

    

    
  }
}
