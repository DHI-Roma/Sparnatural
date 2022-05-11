import tippy from "tippy.js";
import { eventProxiCriteria } from "../../globals/globalfunctions";
import ObjectPropertyTypeId from "./ObjectPropertyTypeId";
import ISpecProvider from "../../spec-providers/ISpecProviders";
import HTMLComponent from "../../HtmlComponent";
import CriteriaGroup from "../criterialist/CriteriaGroup";
import { getSettings } from "../../../configs/client-configs/settings";

/**
 * The property selection part of a criteria/line, encapsulating an ObjectPropertyTypeId
 **/
class ObjectPropertyGroup extends HTMLComponent {
  objectPropertySelector: ObjectPropertyTypeId;
  value_selected: any = null; // value which shows which object property got chosen by the config for subject and object
  ParentCriteriaGroup: CriteriaGroup;
  specProvider: ISpecProvider;
  constructor(
    ParentComponent: CriteriaGroup,
    specProvider: ISpecProvider,
    temporaryLabel: string
  ) {
    super("ObjectPropertyGroup", ParentComponent, null);
    this.ParentCriteriaGroup = ParentComponent;
    this.objectPropertySelector = new ObjectPropertyTypeId(
      this,
      specProvider,
      temporaryLabel
    );
    this.specProvider = specProvider
  }

  render(){
    super.render()
    return this
  }
  /*
		renders the temporarly object property
	*/
  onStartClassGroupSelected() {
    //this will set the temporary label since there hasn't been a Value chosen for EndClassGroup
    this.objectPropertySelector.render();
  }

  /*
		This method is triggered when an Object is selected.
		For example: Museum isRelatedTo Country. As soon as Country is chosen this method gets called
	*/
  onEndClassGroupSelected() {
    // this will update the temporarly label
    this.objectPropertySelector.render();      
      
    this.html[0].dispatchEvent(new CustomEvent('ObjectPropertyGroupSelected',{bubbles:true}))

  }

  onChange() {
    if (this.value_selected) {
      console.warn("ObjectPropertyGroup call OptionsGroup.reload!!!")
      this.ParentCriteriaGroup.OptionsGroup.render();
    }
    this.value_selected = $(this.html).find("select.input-val").val();
    // disable if only one possible property option between the 2 classes
    if ($(this.html).find(".input-val").find("option").length == 1) {
      $(this.html)
        .find(".input-val")
        .attr("disabled", "disabled")
        .niceSelect("update");
    }
    this.html[0].dispatchEvent(new CustomEvent('ObjectPropertyGroupSelected',{bubbles:true}))
    if (
      $(this.ParentCriteriaGroup.html)
        .parent("li")
        .first()
        .hasClass("completed")
    ) {
      this.html[0].dispatchEvent(new CustomEvent('submit',{bubbles:true}))
    }

    // sets tooltip ready
    var desc = this.specProvider.getTooltip(this.value_selected);
    if (desc) {
      $(this.ParentCriteriaGroup.ObjectPropertyGroup.html)
        .find(".ObjectPropertyTypeId")
        .attr("data-tippy-content", desc);
      // tippy('.ObjectPropertyGroup .ObjectPropertyTypeId[data-tippy-content]', settings.tooltipConfig);
      var tippySettings = Object.assign({}, getSettings()?.tooltipConfig);
      tippySettings.placement = "top-start";
      tippy(
        ".ObjectPropertyGroup .ObjectPropertyTypeId[data-tippy-content]",
        tippySettings
      );
    } else {
      $(this.ParentCriteriaGroup.ObjectPropertyGroup.html).removeAttr(
        "data-tippy-content"
      );
    }
    //ici peut être lancer le reload du where si il y a des fils
  }
}
export default ObjectPropertyGroup;
