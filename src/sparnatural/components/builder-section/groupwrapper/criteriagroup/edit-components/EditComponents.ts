import { getSettings } from "../../../../../../configs/client-configs/settings";
import { Config } from "../../../../../../configs/fixed-configs/SparnaturalConfig";
import { SelectedVal } from "../../../../../sparql/ISparJson";
import ISpecProvider from "../../../../../spec-providers/ISpecProviders";
import ActionWhere from "../../../../actions/actioncomponents/ActionWhere";
import HTMLComponent from "../../../../HtmlComponent";
import EndClassGroup from "../startendclassgroup/EndClassGroup";
import { ValueType, WidgetValue } from "./widgets/AbstractWidget";
import WidgetWrapper from "./WidgetWrapper";

export interface SelectAllValue extends WidgetValue{
  value:{
    label:string
  }
}

enum RENDER_WHERE_ENUM {
    LIST_PROPERTY = Config.LIST_PROPERTY,
    LITERAL_LIST_PROPERTY= Config.LITERAL_LIST_PROPERTY,
    AUTOCOMPLETE_PROPERTY=Config.AUTOCOMPLETE_PROPERTY,
    TREE_PROPERTY=Config.TREE_PROPERTY,
    NON_SELECTABLE_PROPERTY = Config.NON_SELECTABLE_PROPERTY
  }

class EditComponents extends HTMLComponent {
    startClassVal: SelectedVal;
    objectPropVal: SelectedVal;
    endClassVal: SelectedVal;
    actionWhere:ActionWhere
    widgetWrapper:WidgetWrapper
    specProvider: ISpecProvider;
    RENDER_WHERE = RENDER_WHERE_ENUM
    constructor(parentComponent:EndClassGroup,startCassVal:SelectedVal,objectPropVal:SelectedVal,endClassVal:SelectedVal,specProvider:ISpecProvider){
        super('EditComponents',parentComponent,null)
        this.startClassVal = startCassVal
        this.objectPropVal = objectPropVal
        this.endClassVal = endClassVal
        this.specProvider = specProvider
    }
    render(): this {
      super.render()
      console.warn('debug here')
      this.widgetWrapper = new WidgetWrapper(
        this,
        this.specProvider,
        this.startClassVal,
        this.objectPropVal,
        this.endClassVal
      ).render();
      
      let widgetType = this.widgetWrapper.getWidgetType()
      if(Object.values(this.RENDER_WHERE).includes(widgetType)){
        this.actionWhere = new ActionWhere(
          this,
          this.specProvider,
          this.#onAddWhere
        ).render();
      }
      this.#addEventListeners()
        return this
    }
    // The selectedValues are widgetValues which got selected by the user
    //For example a list of countries
    renderWidgetsWrapper(){
      super.render()
      this.widgetWrapper.render();
    }
    
    #addEventListeners(){
      // binds a selection in an input widget with the display of the value in the line
      this.widgetWrapper.html[0].addEventListener("selectAll", (e:CustomEvent) => {
          e.stopImmediatePropagation()
          this.#onSelectAll();
      });
    }

    #onSelectAll() {
      let selectAllVal:SelectAllValue ={
        valueType:ValueType.SINGLE,
        value:{
          label: getSettings().langSearch.SelectAllValues
        }

      }
      this.html[0].dispatchEvent(
        new CustomEvent("renderWidgetVal", { bubbles: true,detail:selectAllVal })
      );
    }
    

    //MUST be arrowfunction
     #onAddWhere = () => {
    // render the ViewVarBtn
    this.html[0].dispatchEvent(
      new CustomEvent("addWhereComponent", {
        bubbles: true,
        detail: this.endClassVal,
      })
    );
  };
}

export default EditComponents