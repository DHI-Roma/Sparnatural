import { Config } from "../ontologies/SparnaturalConfig";

/*
    All SpecificationProvider provided by the SpecificationProviderFactory MUST implement this interface
*/
interface ISpecProvider {

  /** Global methods at the config level */
  getAllSparnaturalEntities():Array<string>;
  getEntitiesInDomainOfAnyProperty():Array<string>;
  expandSparql(sparql: string, prefixes: { [key: string]: string }): string;
 
  /** Common methods on entities and properties **/
  getLabel(value_selected: string): string;
  getTooltip(value_selected: string): string;

  /** Methods on entities/classes **/
  getConnectedEntities(entityUri:string):Array<string>;
  hasConnectedEntities(value_selected: string): any;
  getConnectingProperties(domain: string, range: string): Array<string>;
  isLiteralEntity(entityUri: string): boolean;
  isRemoteEntity(entityUri: string): boolean;
  getDefaultLabelProperty(entityUri: string):string|null;
  getIcon(entityUri: string): any;
  getHighlightedIcon(entityUri: string): any;
  
  /** Methods on properties **/
  getPropertyType(objectPropertyId: string): Config;
  getDatasource(propertyId: string): any;
  getTreeChildrenDatasource(propertyId: string): any;
  getTreeRootsDatasource(propertyId: string): any;

  isMultilingual(propertyId: string): boolean;
  
  getBeginDateProperty(propertyId: string): string|null;
  getEndDateProperty(propertyId: string): string|null;
  getExactDateProperty(propertyId: string): string|null;
  
  isEnablingNegation(propertyId: string): boolean;
  isEnablingOptional(propertyId: string): boolean;

  getServiceEndpoint(propertyId:string):string | null;
  isLogicallyExecutedAfter(propertyId:string):boolean;
}
export default ISpecProvider;
