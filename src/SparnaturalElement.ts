require("./assets/js/jquery-nice-select/jquery.nice-select.js");
import "./assets/stylesheets/sparnatural.scss"
import $ from "jquery";
/*SPARNATURAL*/
import { getSettings, mergeSettings } from "./sparnatural/settings/defaultSettings";
import SparnaturalComponent from "./sparnatural/components/SparnaturalComponent";
import { ISparJson } from "./sparnatural/generators/ISparJson";
import QueryLoader from "./sparnatural/querypreloading/QueryLoader";
import { SparnaturalAttributes } from "./SparnaturalAttributes";

/*
  This is the sparnatural HTMLElement. 
  e.g. Interface to the outside world
  Used to configure the Settings and load queries
*/
export class SparnaturalElement extends HTMLElement {
  
  static HTML_ELEMENT_NAME = "spar-natural";

  static EVENT_SUBMIT = "submit";
  static EVENT_QUERY_UPDATED = "queryUpdated";
  static EVENT_RESET = "reset";
  static EVENT_INIT = "init";
  
  // just to avoid name clash with "attributes"
  _attributes: SparnaturalAttributes;
  // for the moment, just keep the handlers in the settings
  // handlers: SparnaturalHandlers;

  sparnatural:SparnaturalComponent;

  constructor() {
    super();
  }

  /**
   * Call display only in the connectedCallback
   */
  connectedCallback() {
    this.display();
  }

  set customization(customization: any) {
    getSettings().customization = customization;
  }

  get customization() {
    return getSettings().customization;
  }

  display() {    
    // render sparnatural 
    this.sparnatural = new SparnaturalComponent();
    // empty the content in case we re-display after an attribute change
    $(this).empty();
    $(this).append(this.sparnatural.html);
    // parse all attributes in the HTML element
    this._attributes = new SparnaturalAttributes(this);

    // just set the settings with the HTML attributes
    // TODO : re-enginer the global settings variable to something more OO
    mergeSettings(this._attributes); 
    this.sparnatural.render();
  }

  /* NOTE : defaultlang is all lowercase, see https://stackoverflow.com/questions/60566257/web-components-attributechangedcallback-not-firing */
  static get observedAttributes() {
    return ["src", "lang", "defaultlang", "endpoint"];
  }
  attributeChangedCallback(name: string, oldValue:string|null, newValue:string|null) {    
    if (oldValue === newValue) {
     return;
    }
   
   // prevents callback to be called on initial creation
   if(oldValue != null) {  
    if(getSettings().debug) {
      console.log(`${name}'s value has been changed from ${oldValue} to ${newValue}`);
    }  

    switch(name) {
      case "src" : {
        getSettings().src = newValue;
        break;
      }
      case "lang" : {
        getSettings().language = newValue;
        break;
      }
      case "defaultlang" : {
        getSettings().defaultLanguage = newValue;
        break;
      }
      case "endpoint" : {
        getSettings().defaultEndpoint = newValue;
        break;
      }
      default : {
        throw new Error("unknown observed attribute ${name}");
      }
    }

    // then display/reprint
    this.display();
   }
  }

  /**
   * Enable the play button when a query has finished executing
   * Can be called from the outside. Removes the loading spinner on the btn
   */
  enablePlayBtn(){
    this.sparnatural.enablePlayBtn()
  }

  /**
   * Disable the play button when query is triggered
   * Can be called from the outside
   */
  disablePlayBtn(){
    this.sparnatural.disablePlayBtn()
  }

  /**
   * Load a saved/predefined query in the visual query builder
   * Can be called from the outside
   * @param query 
   */
  loadQuery(query:ISparJson){
    QueryLoader.setSparnatural(this.sparnatural)
    QueryLoader.loadQuery(query)
  }

  /**
   * Expands the SPARQL query according to the configuration.
   * Can be called from the outside
   * @returns 
   */
  expandSparql(query:string) {
    return this.sparnatural.specProvider.expandSparql(query, this.sparnatural.settings?.sparqlPrefixes);
  }

  /**
   * Clears the current query.
   * Can be called from the outside
   */
  clear() {
    this.sparnatural.BgWrapper.resetCallback();
  }

  registerYasr(yasr:any) {
    this.sparnatural.yasr = yasr;
  }

  registerYasqe(yasqe:any) {
    this.sparnatural.yasqe = yasqe;
  }

}

customElements.get(SparnaturalElement.HTML_ELEMENT_NAME) ||
  window.customElements.define(SparnaturalElement.HTML_ELEMENT_NAME, SparnaturalElement);
  