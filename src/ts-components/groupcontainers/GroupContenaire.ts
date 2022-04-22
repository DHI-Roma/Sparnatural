import JsonLdSpecificationProvider from "../../JsonLdSpecificationProvider";
import { RDFSpecificationProvider } from "../../RDFSpecificationProvider";
import ClassTypeId from "./startendclassgroup/ClassTypeId";
import HTMLComponent from "../htmlcomponents/HtmlComponent";
import ObjectPropertyTypeId from "../htmlcomponents/ObjectPropertyTypeId";
import OptionTypeId from "../htmlcomponents/OptionTypeId";
import CriteriaGroup from "./CriteriaGroup";
import ObjectPropertyTypeWidget from "./ObjectPropertyTypeWidget";

class GroupContenaire extends HTMLComponent {
	parentCriteriaGroup: CriteriaGroup
	constructor(baseCssClass: any, parentComponent: CriteriaGroup, specProvider:JsonLdSpecificationProvider | RDFSpecificationProvider) {
		super(
 			baseCssClass,
 			{
				HasInputsCompleted : false,
				IsOnEdit : false,
				Invisible: false
			},
			parentComponent,
			specProvider,
			null
 		);
		this.parentCriteriaGroup = parentComponent;
	}		

	
	init() {
		console.log("init called with:")
		console.log(this.baseCssClass)
		if (!this.cssClasses.Created) {			
			this.cssClasses.IsOnEdit = true ;
			this.initHtml() ;
			this.attachHtml() ;
			this.cssClasses.Created = true ;				
		} else {
			this.updateCssClasses() ;
		}
	} ;

	onSelectValue(varName:any) {
		var current = $(this.html).find('.nice-select .current').first() ;
		var varNameForDisplay = '<span class="variableName">'+varName.replace('?', '')+'</span>' ;
		$(varNameForDisplay).insertAfter($(current).find('.label').first()) ;

	}
} 
export default GroupContenaire