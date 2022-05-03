import {
  eventProxiCriteria,
  redrawBottomLink,
} from "../../globals/globalfunctions";
import UiuxConfig from "../../../configs/fixed-configs/UiuxConfig";
import CriteriaGroup from "../criterialist/CriteriaGroup";
import ISpecProvider from "../../spec-providers/ISpecProviders";
import ArrowComponent from "../arrows/ArrowComponent";
import OptionalComponent from "./optioncomponents/OptionalComponent";
import NotExistsComponent from "./optioncomponents/NotExistsComponent";
import HTMLComponent from "../../HtmlComponent";

/**
 * Contains the components for Optional and not exists arrow.
 * Components can be triggered when:
 * 1. None of the parents rows (list elements) has it already chosen
 **/
export class OptionsGroup extends HTMLComponent {
  ParentCriteriaGroup: CriteriaGroup;
  valuesSelected: { [key: string]: boolean };
  OptionalComponent: OptionalComponent 
  NotExistsComponent: NotExistsComponent
  crtGroupId:number
  specProvider: ISpecProvider;
  backArrow: ArrowComponent = new ArrowComponent(
    this,
    UiuxConfig.COMPONENT_ARROW_BACK
  );

  constructor(ParentCriteriaGroup: CriteriaGroup, specProvider: ISpecProvider) {
    super("OptionsGroup", ParentCriteriaGroup, null);
    this.specProvider = specProvider
    this.valuesSelected = {};
    this.ParentCriteriaGroup = ParentCriteriaGroup as CriteriaGroup;
    this.OptionalComponent = new OptionalComponent(this,specProvider,this.crtGroupId)
    this.NotExistsComponent = new NotExistsComponent(this,specProvider,this.crtGroupId)
    this.backArrow.cssClasses.Invisible = true;

  }

  render() {
    super.render();
    this.backArrow.render();
    // if there were values selected delete it
    this.valuesSelected = {};
    return this;
  }

  onObjectPropertyGroupSelected() {
    $(this.html).addClass("ShowOnEdit");
    this.#checkIfBackArrowisRenderable()  
  }

  // validates if the Options Arrow can be rendered or not
  #checkIfBackArrowisRenderable(){
    let parentAlreadyOptionEnabled = false
    if(this.ParentCriteriaGroup.ParentGroupWrapper.html.hasClass('Enabled')) parentAlreadyOptionEnabled = true
    if(this.#checkIfOptionPossible && !(parentAlreadyOptionEnabled)){
      //Options like NOTEXISTS are possible and none of the parent has it already activated
      this.#addOptionPossible()
      this.#addEventListener()
    }else{
      this.#addNoOptionPossible()
      if(parentAlreadyOptionEnabled){
        $(this.ParentCriteriaGroup.html).addClass("OptionMenuShowed");
      }
    }
  }

  #addEventListener(){
    $(this.backArrow.html).on("click", (e) =>{
      if ($(this.html).hasClass("Enabled")) {
        // Clicked! now render the optional components
        this.#renderOptionalComponents()
        $(e.target).toggleClass("Opended");
        redrawBottomLink(this.ParentCriteriaGroup.ParentGroupWrapper.html);
      }
    });
  }

  #renderOptionalComponents(){
    // MUST BE WRAPPED INTO LIST DIV
    this.OptionalComponent.render()
    this.NotExistsComponent.render()
  }

  #addNoOptionPossible(){
    this.html.removeClass("NoOptionEnabled")
    this.html.addClass("Disabled")
  }

  #addOptionPossible(){
    this.#renderOptionsGroupBackArrow();
    $(this.html).addClass("Enabled");
    $(this.ParentCriteriaGroup.html).addClass("OptionMenuShowed");
  }

  #checkIfOptionPossible():boolean{
    return  (
      (this.specProvider.isEnablingOptional(
        this.ParentCriteriaGroup.ObjectPropertyGroup.value_selected
      ) &&
        this.specProvider.isEnablingNegation(
          this.ParentCriteriaGroup.ObjectPropertyGroup.value_selected
        )
      )
    ) 
  }

  #renderOptionsGroupBackArrow() {
    this.backArrow = new ArrowComponent(this,UiuxConfig.COMPONENT_OPTION_ARROW_FRONT).render()
  }
}
