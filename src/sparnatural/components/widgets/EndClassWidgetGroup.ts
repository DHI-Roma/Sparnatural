import ObjectPropertyTypeWidget from "./ObjectPropertyTypeWidget";
import { AbstractValue } from "../../sparql/Query";
import { Config } from "../../../configs/fixed-configs/SparnaturalConfig";
import UiuxConfig from "../../../configs/fixed-configs/UiuxConfig";
import CriteriaGroup from "../criterialist/CriteriaGroup";
import { eventProxiCriteria } from "../../globals/globalfunctions";
import ISpecProvider from "../../spec-providers/ISpecProviders";
import { TreeWidget } from "./Widgets";
import { getSettings } from "../../../configs/client-configs/settings";
import HTMLComponent from "../../HtmlComponent";

class EndClassWidgetGroup extends HTMLComponent {
  ParentCriteriaGroup: CriteriaGroup;
  selectedValues: Array<any> = [];
  selectAllValue: boolean = true;
  VALUE_SELECTION_WIDGETS = [
    Config.LIST_PROPERTY,
    Config.LITERAL_LIST_PROPERTY,
    Config.AUTOCOMPLETE_PROPERTY,
    Config.TREE_PROPERTY,
  ];
  inputTypeComponent: ObjectPropertyTypeWidget;
  constructor(
    CriteriaGroup: CriteriaGroup,
    specProvider: ISpecProvider
  ) {
    super("EndClassWidgetGroup", CriteriaGroup,null);
    this.inputTypeComponent = new ObjectPropertyTypeWidget(
      this,
      getSettings(),
      specProvider
    );
    this.ParentCriteriaGroup = CriteriaGroup;
  }

  render(){
    super.render()
    return this
  }
  /**
   * Called when the property/link between domain and range is selected, to init this.
   **/
  onObjectPropertyGroupSelected() {
    console.warn('onObjectPropertyGroupSelected!!!!')
    this.inputTypeComponent.render()
    // binds a selection in an input widget with the display of the value in the line
    this.inputTypeComponent.html.on("change",()=>{
      this.#onChange()
      });
    // binds a selection in an input widget with the display of the value in the line
    this.inputTypeComponent.html.on('selectAll',()=>{
      this.#onSelectAll()
    });
    
    /*
    if (this.ParentCriteriaGroup.jsonQueryBranch != null) {
      var branch = this.ParentCriteriaGroup.jsonQueryBranch;
      if (branch.line.values.length == 0) {
        if (branch.children.length == 0) {
          if (this.inputTypeComponent.canHaveSelectAll()) {
            this.#onSelectAll();
          }
        }
      } else {
        for (var key in branch.line.values) {
          this.loadValue(branch.line.values[key]);
        }
      }
    }*/
    
  }

  // input : the 'key' of the value to be deleted
  onremoveValue(e: any) {
    console.warn('endclasswidget on remove value was called')
    if (this.selectAllValue) {
      //unselect the endClass for view
      this.ParentCriteriaGroup.EndClassGroup.onchangeViewVariable();
    }
    //On all case, selectAllValue will be set to false
    this.selectAllValue = false;

    var keyToBeDeleted = $(e.currentTarget).attr("value-data");
    this.selectedValues.filter((item) => {
      return item.key != keyToBeDeleted;
    }); 


    $(this.ParentCriteriaGroup.html)
      .find(".EndClassWidgetGroup .EndClassWidgetAddOrValue")
      .show();
    $(this.ParentCriteriaGroup.html).removeClass("onAddOrValue");

    $(e.currentTarget).parent("div").remove();

    //if jstree remove unselecteds term
    if (this.inputTypeComponent.widgetType == Config.TREE_PROPERTY) {
      (this.inputTypeComponent.widgetComponent as TreeWidget).jsTree.jstree(
        "uncheck_node",
        $(e.currentTarget).attr("value-data")
      );
    }
    //uncheck_node()

    if (this.selectedValues.length < 1) {
      //$(this.ParentCriteriaGroup.ComponentHtml).removeClass("completed");
      $(this.ParentCriteriaGroup.html)
        .find(".EndClassWidgetGroup >.EndClassWidgetAddOrValue")
        .remove();
      $(this.ParentCriteriaGroup.html)
        .parent("li")
        .removeClass("WhereImpossible");
      // N'est plus à cacher, lutilisateur peut choisi d'afficher les valeurs
      //$(this.ParentCriteriaGroup.html).parent('li').removeClass('hideEndClassProperty') ;

      // re-enable Where action if end class can be connected to others
      if (
        this.ParentCriteriaGroup.EndClassGroup.specProvider.hasConnectedClasses(
          this.ParentCriteriaGroup.EndClassGroup.value_selected
        )
      ) {
        $(this.ParentCriteriaGroup.html)
          .parent("li")
          .removeClass("WhereImpossible");
      } else {
        $(this.ParentCriteriaGroup.html)
          .parent("li")
          .addClass("WhereImpossible");
      }

      // re-enable selection of property/link if there are multiple choices of properties
      if (
        $(this.ParentCriteriaGroup.ObjectPropertyGroup.html)
          .find(".input-val")
          .find("option").length > 1
      ) {
        $(this.ParentCriteriaGroup.ObjectPropertyGroup.html)
          .find(".input-val")
          .removeAttr("disabled")
          .niceSelect("update");
      } else {
        $(this.ParentCriteriaGroup.ObjectPropertyGroup.html)
          .find(".input-val")
          .attr("disabled", "disabled")
          .niceSelect("update");
      }

      // re-init the widget to empty input field
      this.inputTypeComponent.render();
    }

    $(this.ParentCriteriaGroup).trigger("EndClassWidgetGroupUnselected");
    this.html[0].dispatchEvent(new CustomEvent('submit',{bubbles:true}))
    this.html[0].dispatchEvent(new CustomEvent('initGenerEvent',{bubbles:true}))
    
  }

  loadValue = function loadValue(value: any) {
    this.inputTypeComponent.loadedValue =
      AbstractValue.valueToWidgetValue(value);
    $(this.inputTypeComponent).trigger("change");
    //Value added don't reuse preloaded data.
    this.inputTypeComponent.loadedValue = null;
  };

  #onSelectAll() {
    var theValueLabel =
      "<span>" + getSettings().langSearch.SelectAllValues + "</span>";
    this.selectAllValue = true;
    let unselect = $(
      '<span class="unselect" value-data="allValues"><i class="far fa-times-circle"></i></span>'
    );
    if (
      $(this.ParentCriteriaGroup.html).find(".EndClassWidgetGroup>div")
        .length == 0
    ) {
      $(this.ParentCriteriaGroup.html)
        .find(".EndClassWidgetGroup")
        .append(
          $(
            '<div class="EndClassWidgetValue flexWrap"><div class="componentBackArrow">' +
              UiuxConfig.COMPONENT_ARROW_BACK +
              "</div><p>" +
              theValueLabel +
              '</p><div class="componentFrontArrow">' +
              UiuxConfig.COMPONENT_ARROW_FRONT +
              "</div></div>"
          )
        )
        .find("div")
        .first()
        .append(unselect);
    }

    unselect.on(
      "click",
      { arg1: this, arg2: "onRemoveValue" },
      eventProxiCriteria
    );

    // disable the Where
    $(this.ParentCriteriaGroup.html).parent("li").addClass("WhereImpossible");
    $(this.ParentCriteriaGroup.html)
      .find(".EndClassGroup>div")
      .first()
      .removeClass("newOr");

    //Add variable on results view
    if (!this.ParentCriteriaGroup.EndClassGroup.notSelectForview) {
      if (this.ParentCriteriaGroup.EndClassGroup.variableSelector == null) {
        this.ParentCriteriaGroup.EndClassGroup.onchangeViewVariable();
      }
    }
    this.ParentCriteriaGroup.initCompleted();

    $(this.ParentCriteriaGroup).trigger("EndClassWidgetGroupSelected");
    this.html[0].dispatchEvent(new CustomEvent('submit',{bubbles:true}))
    this.html[0].dispatchEvent(new CustomEvent('initGenerEvent',{bubbles:true}))
  }
  // this method renders Arrow Components on the ClassTypeId's
  #highlightArrowComponentents(){
    this.ParentCriteriaGroup.EndClassGroup.inputTypeComponent.highlight()
    this.ParentCriteriaGroup.StartClassGroup.inputTypeComponent.highlight()
  }

  #onChange() {
    //TODO render here the back and front arrow for both InputClasstypes
    this.#highlightArrowComponentents()

    console.warn("endclasswidgetGroup onChange called")
    var theValue = this.inputTypeComponent.getValue(); // could be array or single value
    // put span around with proper class if coming from a date widget

    if (theValue == null) {
      return false;
    }
    var new_items: any[] = [];
    if (
      this.inputTypeComponent.widgetType == Config.TREE_PROPERTY &&
      // when loading the value from a saved query, the value is not an array, it is
      // a simple value.
      Array.isArray(theValue)
    ) {
      for (var node in theValue) {
        var selected = false;
        // if the same value is already selected, don't do anything
        for (var item in this.selectedValues) {
          if (this.selectedValues[item].key == theValue[node].id) {
            selected = true;
          }
        }
        if (selected == false) {
          new_items.push(theValue[node]);
          this.selectedValues.push(theValue[node]);
        }
      }
      //Check if values removed
      for (var item in this.selectedValues) {
        var selected = false;
        for (var node in theValue) {
          if (this.selectedValues[item].key == theValue[node].id) {
            selected = true;
          }
        }
        if (selected == false) {
          $(this.ParentCriteriaGroup.html)
            .find(
              '.EndClassWidgetGroup span[value-data="' +
                this.selectedValues[item].key +
                '"]'
            )
            .first()
            .trigger("click");
        }
      }
    } else {
      // if the same value is already selected, don't do anything
      for (var item in this.selectedValues) {
        if (this.selectedValues[item].key == theValue.key) {
          return false;
        }
      }
      new_items.push(theValue);
      this.selectedValues.push(theValue);
    }

    // var value_data = (Array.isArray(theValue))?theValue.toString():theValue;
    console.log('what are these values?')
    console.dir(new_items)
    this.#renderAllItemsSelected(new_items,theValue)

    // disable the Where
    $(this.ParentCriteriaGroup.html).parent("li").addClass("WhereImpossible");
    $(this.ParentCriteriaGroup.html).removeClass("onAddOrValue");

    this.ParentCriteriaGroup.initCompleted();

    $(this.ParentCriteriaGroup).trigger("EndClassWidgetGroupSelected");
    this.html[0].dispatchEvent(new CustomEvent('submit',{bubbles:true}))


    //Plus d'ajout possible si nombre de valeur suppérieur à l'option maxOr
    if (this.selectedValues.length == getSettings().maxOr) {
      $(this.ParentCriteriaGroup.html)
        .find(".EndClassWidgetGroup .EndClassWidgetAddOrValue")
        .hide();
    }

    if (this.selectedValues.length > 0) {
      $(this.ParentCriteriaGroup.ObjectPropertyGroup.html)
        .find(".input-val")
        .attr("disabled", "disabled")
        .niceSelect("update");
    }

    $(this.ParentCriteriaGroup.html)
      .find(".EndClassGroup>.EditComponents")
      .removeClass("newOr");
      this.html[0].dispatchEvent(new CustomEvent('initGenerEvent',{bubbles:true}))
  }

  // All items which got selected in the widget will be added add the back of the EndClassGroup.
  #renderAllItemsSelected(new_items:Array<any>,theValue:any){
    for (var new_item in new_items) {
      theValue = new_items[new_item];

      var theValueLabel =
        "<span" +
        (theValue.start || theValue.stop ? ' class="label-two-line"' : "") +
        ">" +
        theValue.label +
        "</span>";

      let unselect = $(
        '<span class="unselect" value-data="' +
          theValue.key +
          '"><i class="far fa-times-circle"></i></span>'
      );
      if (
        $(this.ParentCriteriaGroup.html).find(".EndClassWidgetGroup>div")
          .length == 0
      ) {
        // set a tooltip if the label is a bit long
        var tooltip =
          theValue.label.length > 25 ? 'title="' + theValue.label + '"' : "";
        $(this.ParentCriteriaGroup.html)
          .find(".EndClassWidgetGroup")
          .append(
            $(
              '<div class="EndClassWidgetValue flexWrap"><div class="componentBackArrow">' +
                UiuxConfig.COMPONENT_ARROW_BACK +
                "</div><p " +
                tooltip +
                ">" +
                theValueLabel +
                '</p><div class="componentFrontArrow">' +
                UiuxConfig.COMPONENT_ARROW_FRONT +
                "</div></div>"
            )
          )
          .find("div")
          .first()
          .append(unselect);

        if (
          this.VALUE_SELECTION_WIDGETS.indexOf(
            this.inputTypeComponent.widgetType
          ) !== -1
        ) {
          //if ($(this.ParentCriteriaGroup.html).find('.EndClassWidgetGroup>div').length == 1) { Now is sures, we have one
          $(this.ParentCriteriaGroup.html)
            .find(".EndClassWidgetGroup")
            .append(
              '<div class="EndClassWidgetAddOrValue flexWrap"><div class="componentBackArrow">' +
                UiuxConfig.COMPONENT_ARROW_BACK +
                '</div><p><span>+</span></p><div class="componentFrontArrow">' +
                UiuxConfig.COMPONENT_ARROW_FRONT +
                "</div></div>"
            );
          // hook a click on the plus to the needAddOrValue function
          $(this.ParentCriteriaGroup.html)
            .find(".EndClassWidgetGroup>.EndClassWidgetAddOrValue")
            .on(
              "click",
              { arg1: this, arg2: "onAddOrValue" },
              eventProxiCriteria
            );
          //}
        }
      } else {
        var temp_html = $(
          '<div class="EndClassWidgetValue flexWrap"><div class="componentBackArrow">' +
            UiuxConfig.COMPONENT_ARROW_BACK +
            "</div><p>" +
            theValueLabel +
            '</p><div class="componentFrontArrow">' +
            UiuxConfig.COMPONENT_ARROW_FRONT +
            "</div></div>"
        ).append(unselect);
        $(this.ParentCriteriaGroup.html)
          .find(".EndClassWidgetGroup >.EndClassWidgetAddOrValue")
          .before(temp_html);
      }

      // binds a click on the remove cross with the removeValue function
      unselect.on(
        "click",
        { arg1: this, arg2: "onRemoveValue" },
        eventProxiCriteria
      );
    }

  }

  //This is called when a value is selected from a list and you would like to add more values
  onAddOrValue() {
    
    $(this.ParentCriteriaGroup.html).find('.EndClassGroup>.EditComponents').addClass('newOr') ;
    $(this.ParentCriteriaGroup.html).addClass('onAddOrValue') ;
    // On vide les champs de saisie du widget
    if (!(this.inputTypeComponent.widgetType == Config.TREE_PROPERTY)) {
      this.inputTypeComponent.render() ;
    } else {
      //On avffiche de suite l'arbre. Car pas d'autre action possible
      $(this.ParentCriteriaGroup.EndClassGroup).find('a.treeBtnDisplay').first().trigger('click') ;
    }
    
    this.html[0].dispatchEvent(new CustomEvent('initGeneralEvent',{bubbles:true}))
  };
}
export default EndClassWidgetGroup;
