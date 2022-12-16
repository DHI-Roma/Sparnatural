require("./assets/js/jquery-nice-select/jquery.nice-select.js");
require("./assets/stylesheets/sparnatural.scss");
import $ from "jquery";
/* FONT AWESOME*/
require("@fortawesome/fontawesome-free");
import { IconPack, library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
library.add(fas);
library.add(far as IconPack);
/*SPARNATURAL*/
import { getSettings, mergeSettings } from "./sparnatural/settings/defaultSettings";
import SparnaturalComponent from "./sparnatural/components/SparnaturalComponent";
import ISpecProvider from "./sparnatural/spec-providers/ISpecProvider";
import { ISparJson } from "./sparnatural/generators/ISparJson";
import { PreLoadQueries } from "./sparnatural/settings/ISettings";
import QueryLoader from "./sparnatural/querypreloading/QueryLoader";
import QueryParser from "./sparnatural/querypreloading/QueryParser";
import { SparnaturalAttributes } from "./SparnaturalAttributes";
import { SparnaturalHandlers } from "./SparnaturalHandlers";

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
  
  // just to avoid name clash with "attributes"
  _attributes: SparnaturalAttributes;
  // for the moment, just keep the handlers in the settings
  // handlers: SparnaturalHandlers;

  Sparnatural:SparnaturalComponent;
  specProvider: ISpecProvider;

  constructor() {
    super();
    // parse all attributes in the HTML element
    this._attributes = new SparnaturalAttributes(this);
    // TODO : migrate handlers outside of settings
    // this.handlers = new SparnaturalHandlers();

    // just set the settings with this
    // TODO : re-enginer the global settings variable to something more OO
    mergeSettings(this._attributes);

    this.initSparnatural();
  }

  initSparnatural() {
    // init the Sparnatural component and render it
    this.Sparnatural = new SparnaturalComponent(this);
    // empty the content in case we reinit after an attribut change
    $(this).empty();
    $(this).append(this.Sparnatural.html);
    this.Sparnatural.render();
  }

  set autocomplete(autocomplete: any) {
    getSettings().autocomplete = autocomplete;
  }

  set list(list: any) {
    getSettings().list = list;
  }

  set dates(dates: any) {
    getSettings().dates = dates;
  }

  get autocomplete() {
    return getSettings().autocomplete;
  }

  get list() {
    return getSettings().list;
  }

  get dates() {
    return getSettings().dates;
  }

  /* Experimental : re-init Sparnatural when some attributes change dynamically */
  static get observedAttributes() {
    return ["language", "src", "endpoint"];
  }

  attributeChangedCallback(name: string, oldValue: string|null, newValue: string|null): void {
    if (oldValue === newValue) {
     return;
    }

    if(oldValue != null) {
      if(name === "language") {        
          getSettings().language = newValue;
          this.initSparnatural();
      }

      if(name === "src") {        
        getSettings().config = newValue;
        this.initSparnatural();
      }

      if(name === "endpoint") {        
        getSettings().defaultEndpoint = newValue;
        this.initSparnatural();
      }
    }
  }

  /**
   * Enable the play button when a query has finished executing
   * Can be called from the outside
   */
  enablePlayBtn(){
    this.Sparnatural.enablePlayBtn()
  }

  /**
   * Disable the play button when query is triggered
   * Can be called from the outside
   */
  disablePlayBtn(){
    this.Sparnatural.disablePlayBtn()
  }

  /**
   * Load a saved/predefined query in the visual query builder
   * Can be called from the outside
   * @param query 
   */
  loadQuery(query:ISparJson){
    QueryLoader.setSparnatural(this.Sparnatural)
    QueryLoader.loadQuery(query)
  }

  /**
   * Expands the SPARQL query according to the configuration.
   * Can be called from the outside
   * @returns 
   */
  expandSparql(query:string) {
    return this.Sparnatural.specProvider.expandSparql(query, this.Sparnatural.settings.sparqlPrefixes);
  }

  /**
   * Clears the current query.
   * Can be called from the outside
   */
  clear() {
    this.Sparnatural.BgWrapper.resetCallback();
  }

  /**
   * TODO : should be removed
   */
  parseQueries(queries:PreLoadQueries){
    return QueryParser.parseQueries(queries)
  }
}

customElements.get(SparnaturalElement.HTML_ELEMENT_NAME) ||
  window.customElements.define(SparnaturalElement.HTML_ELEMENT_NAME, SparnaturalElement);
  