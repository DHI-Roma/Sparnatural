import Sparnatural from "../components/SparnaturalComponent";

export interface PreLoadQueries {
  queries: Array<{ queryName: string; query: string }>;
}

interface ISettings {
  config: any;
  language: string;
  addDistinct?: boolean;
  typePredicate?: string;
  maxDepth: number;
  maxOr: number;
  backgroundBaseColor?: string; //TODO '250,136,3'
  sparqlPrefixes?: { [key: string]: string };
  defaultEndpoint?: string | (() => string);
  localCacheDataTtl?: number;
  // TODO : this should not be exposed.
  // Only the language parametre is exposed, but the actual labels content should not
  langSearch?: any;
  autocomplete?: any;
  list?: any;
  dates?: any;
  tooltipConfig?: any;
  debug: boolean;
  onQueryUpdated?: (
    // the SPARQL query String
    queryString: any,
    // the Sparnatural JSON format
    queryJson: any,
    // the SPARQL data structure, as sparql.js
    sparqlAsJson: any
  ) => void;
  onSubmit?: (sparnatural: Sparnatural) => void;
  onReset?: (sparnatural: Sparnatural) => void;
}

export default ISettings;
