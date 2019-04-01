//@prepros-append jquery-nice-select/js/jquery.nice-select.js
//@prepros-append EasyAutocomplete/jquery.easy-autocomplete.js
(function( $ ) {
 
    $.fn.SimSemSearchForm = function( options ) {
 
        var specSearch = {} ;
        var langSearch = {} ;
		var defaults = {
			pathSpecSearch: 'config/spec-search.json',
			pathLanguages: 'config/lang/',
			language: 'en',
			addDistinct: false,
			typePredicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
			maxDepth: 3,
			maxOr: 3,
			backgroundBaseColor: '250,136,3',
			
			autocomplete : {
				url : function(domain, property, range, key) {
					console.log("Veuillez préciser le nom de la fonction pour l'option autocompleteUrl dans les parametre d'initalisation de SimSemSearchForm. La liste des parametres envoyées a votre fonction est la suivante : domain, property, range, key"  ) ;
				},
				listLocation: function(domain, property, range, data) {
					return data;
				},
				elementLabel: function(element) {
					return element.label;
				},
				elementUri: function(element) {
					return element.uri;
				},
				enableMatch: function(domain, property, range) {
					return false;
				},
			},			
			list : {
				url : function(domain, property, range) {
					console.log("Veuillez préciser le nom de la fonction pour l'option listUrl dans les parametre d'initalisation de SimSemSearchForm. La liste des parametres envoyées a votre fonction est la suivante : domain, property, range" ) ;
				},
				listLocation: function(domain, property, range, data) {
					return data;
				},
				elementLabel: function(element) {
					return element.label;
				},
				elementUri: function(element) {
					return element.uri;
				}
			},
			dates : {
				url : function(domain, property, range, key) {
					console.log("Veuillez préciser le nom de la fonction pour l'option datesUrl dans les parametre d'initalisation de SimSemSearchForm. La liste des parametres envoyées a votre fonction est la suivante : domain, property, range, key" ) ;
				},
				listLocation: function(domain, property, range, data) {
					return data;
				},
				elementLabel: function(element) {
					return element.label+' '+element.synonyms.join(' ');
				},
				elementStart: function(element) {
					return element.start.year;
				},
				elementEnd: function(element) {
					return element.stop.year;
				}
				
			},
			
			onQueryUpdated : function (queryString, queryJson) {
				console.log("Veuillez préciser le nom de la fonction pour l'option onQueryUpdated dans les parametre d'initalisation de SimSemSearchForm. Les parêtres envoyés à la fonction contiendront la requête convertie en Sparql et le Json servant à générer la requête" ) ;
			}
		};
		
		var TYPE_WIDGET_LIST_URI = 'http://ontologies.sparna.fr/SimSemSearch#ListWidget';
		var TYPE_WIDGET_TIME_URI = 'http://ontologies.sparna.fr/SimSemSearch#TimeWidget';
		var TYPE_WIDGET_AUTOCOMPLETE_URI = 'http://ontologies.sparna.fr/SimSemSearch#AutocompleteWidget';
		var TYPE_WIDGET_SEARCH_URI = 'http://ontologies.sparna.fr/SimSemSearch#SearchWidget';
		
		/*Utiliser pour affichage texte avant champ de recherhce mot clés */
		var LABEL_URI = 'http://www.openarchaeo.fr/explorateur/onto#Label';
		
		var VALUE_SELECTION_WIDGETS = [TYPE_WIDGET_LIST_URI, TYPE_WIDGET_AUTOCOMPLETE_URI];
		
		var settings = $.extend( true, {}, defaults, options );
		
		function gatLabel(graphItemID) {
			var label = ''; 
			$.each( graphItemID['label'], function( key, val ) {
				if ( val['@language'] == settings.language) {
					label = val['@value'] ;
				}
			}) ;
			
			return label ;
			
		}
		
		this.each(function() {
            var thisForm = {} ;
            thisForm._this = $(this) ;
			$(this).addClass('SimSemSearch') ;
			
			thisForm.components = [] ;
			
			$.when( loadSpecSearch() && loadLangSearch() ).done(function() {
					initForm(thisForm) ;
				 });
        });
		
		function loadSpecSearch() {
			
			return $.getJSON( settings.pathSpecSearch, function( data ) {
				specSearch = data ;
			}).fail(function(response) {
				console.log("SimSemSearch - unable to load config file : " +settings.pathSpecSearch);
				console.log(response);
			}) ;
		}
		function loadLangSearch() {
			var fileName = settings.language+'.json' ;
			return $.getJSON( settings.pathLanguages+ fileName, function( data ) {
				langSearch = data ;
			}).fail(function(response) {
				console.log("SimSemSearch - unable to load lang file : " +settings.pathLanguages+ fileName);
				console.log(response);
			}) ;
		}
		
		function initForm(thisForm_) {
			
			var contexte = $('<div class="bg-wrapper"><ul class="componentsListe"></ul></div>');
			//contexte.appendTo(thisForm_._this) ;
			$(thisForm_._this).append(contexte) ;
			
			contexte1 = addComponent(thisForm_, contexte.find('ul')) ;
			
			$(thisForm_._this).find('.nice-select').trigger('click') ;
			
			intiGeneralEvent(thisForm_) ;
			
			$(thisForm_._this).on('submit', { formObject : thisForm_ }, function (event) {
				
				event.preventDefault();
				
				ExecuteSubmited(event.data.formObject) ;
				
			}) ;

		}
		
		function newQueryJson() {
			var ifDistinct = '' ;
			if (settings.addDistinct) {
				ifDistinct = ' DISTINCT' ;
			}
			return {
				"queryType": "SELECT"+ifDistinct+"",
				"variables": [
					"?this"
				],
				"where": [],
				"type": "query",
				"prefixes": {
					"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
					"xsd": "http://www.w3.org/2001/XMLSchema#"
				}
			}
		}
		
		function initTriple() {
			
			return {
					"type": "bgp",
					"triples": []
			} ;
		}
		function initValues() {
			
			return {
					"type": "values",
					"values": []
				} ;
		}
		function initFilterTime(StartYear, EndYear, index) {
			
			return {
				"type": "filter",
				"expression": {
					"type": "operation",
					"operator": "&&",
					"args": [
						{
							"type": "operation",
							"operator": ">",
							"args": [
								""+index+"",
								"\""+StartYear+"-01-01\"^^http://www.w3.org/2001/XMLSchema#dateTime"
							]
						},
						{
							"type": "operation",
							"operator": "<=",
							"args": [
								""+index+"",
								"\""+EndYear+"-12-31\"^^http://www.w3.org/2001/XMLSchema#dateTime"
							]
						}
					]
				}
			} ;
		}
		function initFilterSearch(Texte, index) {
			
			return {
				"type": "filter",
				"expression": {
					"type": "operation",
					"operator": "regex",
					"args": [
						
						""+index+"",
						"\""+Texte+"\"",
						"\"i\""
					]
				}
			} ;
		}

		function addTriple(jsonTriples, subjet, predicate, object) {
			
			var triple = {
				"subject": subjet,
				"predicate": predicate,
				"object": object,
			} ;
						
			jsonTriples.triples.push(triple) ;
			
			return jsonTriples ;
		}
		
		function addInWhere(Json, JsonToWhere) {
			Json.where.push(JsonToWhere) ;		
			return Json ;
		}

		function addVariable(jsonValues, name, valueUrl) {
			
			$.each(valueUrl, function( index, value ) {
			  //alert( index + ": " + value );
			  var newValue = {
							//[name]: value
						}
					newValue[name] = value ;
				jsonValues.values.push(newValue) ;		
			  
			});
			
			return jsonValues ;	
		}
		function addVariableDate(json, name, valueUrl) {
			
			var newValue = {
							//[name]: valueUrl
						}
				newValue[name] = valueUrl ;
				json.where[1].values.push(newValue) ;		
			
			return json ;	
		}
		
		function ExecuteSubmited(formObject) {
			
			//console.log(formObject) ;
			
			var Json = newQueryJson() ;
			//var levelCriteria = [] ;
			//var levelCursor = 0 ;
			//var ComponentsTree = [] ;
			//var VarsString = [] ;
			
			
			var ArrayLiIndex = [] ;

			var all_complete = true ;
			
			$(formObject._this).find('ul.componentsListe li.groupe').each(function(i) {
				
				var data_id = $(this).attr('data-index') ;

				ArrayLiIndex[data_id] = ArrayLiIndex.length ;
				//console.log(this);
				
				/*if (!$(this).hasClass('completed')) {
					all_complete = false ;
				}*/
				
			}) ;
			
			
			if (!all_complete) {
				return false ;
			}
			
			var have_queriable_criteres = false ;
			
			$(formObject.components).each(function(i) {
					
					var next_loop = false ;
					
					//if(typeof(this.CriteriaGroup.EndClassWidgetGroup.value_selected) == "undefined" || this.CriteriaGroup.EndClassWidgetGroup.value_selected === null) {
					if(this.CriteriaGroup.EndClassWidgetGroup.value_selected.length === 0 ) {
					
						var WidgetsNeedValueIds = [TYPE_WIDGET_SEARCH_URI, TYPE_WIDGET_TIME_URI] ;
						if ($.inArray(this.CriteriaGroup.EndClassWidgetGroup.widgetType, WidgetsNeedValueIds) > -1) {
							next_loop = true ;
						}

					}
					
					if (next_loop) {
						return true;
					} else {
						have_queriable_criteres = true ;
					}
					
					var dependantDe = GetDependantCriteria(formObject, this.index ) ;
					var addStartClass = true ;
					
					if ((dependantDe != null) && (dependantDe.type == 'parent')){
						
						StartVar = ArrayLiIndex[dependantDe.element.id] + 1;
						if (StartVar == 0) {
							StartVar = 'this' ;
						} 
						
						EndVar = ArrayLiIndex[this.index] + 1;
						
						addStartClass = false ;
						
					} else {
						
						StartVar = 'this' ;
						EndVar = ArrayLiIndex[this.index] + 1 ;
						/*levelCursor = 0 ;
						levelCriteria[levelCursor] = this.index ;*/
					}
					if ((dependantDe != null) && (dependantDe.type == 'sibling')){
						addStartClass = false ;
					}
					
					
					
					
					var start = this.CriteriaGroup.StartClassGroup.value_selected ;
					var obj = this.CriteriaGroup.ObjectPropertyGroup.value_selected ;
					var end = this.CriteriaGroup.EndClassGroup.value_selected ; 
					
					if (start.indexOf("#") > -1) {
						var StartLabel = start.split("#") ;
						StartLabel = StartLabel[1] ;
					} else {
						var StartLabel = start.split("/") ;
						StartLabel = StartLabel[StartLabel.length - 1] ;
					}
					/** A traiter dans les cas ou une recherche est effectuer directement avec un mot clé ou si selecction incomplete **/
					if (end.indexOf("#") > -1) {
						var EndLabel = end.split("#") ;
						EndLabel = EndLabel[1] ;
					} else {
						var EndLabel = end.split("/") ;
						EndLabel = EndLabel[EndLabel.length - 1] ;
					}
					
					if (StartVar != 'this') {
						StartVar = StartLabel+''+StartVar ;
					}

					EndVar = EndLabel+''+EndVar ;

					
					
					/*if (levelCursor == 0) {
						var varSuffixe = 'this' ;
						var varSuffixeEnd = 'end'+this.index ;
					} else {
						if (levelCursor-1 == -20) {
							var varSuffixe = '';
							var varSuffixeEnd = this.index ;
						} else {
							var varSuffixe = 'end'+levelCriteria[levelCursor-1] ;
							var varSuffixeEnd = 'end'+this.index ;
						}
						
					}*/

					//this.CriteriaGroup.StartClassGroup.value_selected
					
					
					//console.log(end) ;
					var endValueName = '?'+EndVar ;
					
					var new_triple = initTriple() ;
					if (addStartClass) {
						new_triple = addTriple(new_triple, '?'+StartVar, settings.typePredicate, start) ;
					}
					
					
					
					
					
					_WidgetType = this.CriteriaGroup.EndClassWidgetGroup.widgetType ;
					
					
					
					
					
					if ( VALUE_SELECTION_WIDGETS.indexOf(_WidgetType) !== -1 ) {						
						if (this.CriteriaGroup.EndClassWidgetGroup.value_selected.length == 1) {						
							new_triple = addTriple(new_triple, '?'+StartVar, obj, this.CriteriaGroup.EndClassWidgetGroup.value_selected[0]) ;
						} else {
							new_triple = addTriple(new_triple, '?'+StartVar, obj, endValueName) ;
						}						
					} else {
						new_triple = addTriple(new_triple, '?'+StartVar, obj, endValueName) ;
					}
					
					//if(typeof(this.CriteriaGroup.EndClassWidgetGroup.value_selected) != "undefined" && this.CriteriaGroup.EndClassWidgetGroup.value_selected !== null) {
					if(this.CriteriaGroup.EndClassWidgetGroup.value_selected.length !== 0 ) {
						
					} else {
						//new_triple = addTriple(new_triple, endValueName, settings.typePredicate, end) ;
					}
					
					Json = addInWhere(Json, new_triple) ;
					
					
					//if(typeof(this.CriteriaGroup.EndClassWidgetGroup.value_selected) != "undefined" && this.CriteriaGroup.EndClassWidgetGroup.value_selected !== null) {
					if(this.CriteriaGroup.EndClassWidgetGroup.value_selected.length > 0 ) {
						
						var jsonValue = initValues() ;
						
						switch (_WidgetType) {
						
						 case TYPE_WIDGET_LIST_URI:
						  //var id_input = '#ecgrw-'+ this.index +'-input-value' ;
							//value_widget = $(id_input).val() ;
							if (this.CriteriaGroup.EndClassWidgetGroup.value_selected.length > 1) {
								jsonValue = addVariable(jsonValue, endValueName, this.CriteriaGroup.EndClassWidgetGroup.value_selected)
						
								Json = addInWhere(Json, jsonValue) ;
							}
							
							
							
							break;
						  case TYPE_WIDGET_AUTOCOMPLETE_URI:
							//var id_input = '#ecgrw-'+ this.index +'-input-value' ;
							//value_widget = $(id_input).val() ;
							if (this.CriteriaGroup.EndClassWidgetGroup.value_selected.length > 1) {
								jsonValue = addVariable(jsonValue, endValueName, this.CriteriaGroup.EndClassWidgetGroup.value_selected)
							
								Json = addInWhere(Json, jsonValue) ;
							}
							break;
						  case TYPE_WIDGET_TIME_URI:
							//console.log('Mangoes and papayas are $2.79 a pound.');
							
							//var StartYear = $('#ecgrw-date-'+ this.index +'-input-start').val() ;
							//var EndYear = $('#ecgrw-date-'+ this.index +'-input-stop').val() ;
							//value_widget = $(id_input).val() ;
							
							
							$.each(this.CriteriaGroup.EndClassWidgetGroup.value_selected, function( index, value ) {
							  //alert( index + ": " + value );
							



								jsonFilter = initFilterTime(value.start, value.stop, endValueName) ;
							
							
								//jsonFilter = initFilterSearch(Texte, endValueName) ;
							
								Json = addInWhere(Json, jsonFilter) ;
							  
							});
			
			
			
							
							
							// expected output: "Mangoes and papayas are $2.79 a pound."
							break;
						  case TYPE_WIDGET_SEARCH_URI:
							//console.log('Mangoes and papayas are $2.79 a pound.');
							var Texte = $('#ecgrw-search-'+ this.index +'-input-value').val() ;
							jsonFilter = initFilterSearch(Texte, endValueName) ;
							
							Json = addInWhere(Json, jsonFilter) ;
							
							// expected output: "Mangoes and papayas are $2.79 a pound."
							break;
						  default:
						
						
						}
						
					} else {
						
						
					}



					//console.log(value_widget)
					/*if ($('.EndClassWidgetGroup>div').hasClass('ListeWidget')) {
						json = addVariable(json, endValueName, $('.EndClassWidgetGroup #listwidget').val() ) ;
					} else {
						json = addVariable(json, endValueName, $('.EndClassWidgetGroup #basics-value').val() ) ;
					}*/
					
					
					
					
					
				}) ;
				
			console.log(Json) ;
					
			if (have_queriable_criteres) {
					//var SparqlGenerator = require('sparqljs').Generator;
				var generator = new Ngenerator();
				//parsedQuery.variables = ['?mickey'];
				var generatedQuery = generator.stringify(Json);
						
						
				//console.log(generatedQuery) ;
						
						
				//$('#sparql code').html(generatedQuery.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
				//var jsons = JSON.stringify(Json, null, '\t');
				//$('#json code').html(jsons) ;
				
				settings.onQueryUpdated(generatedQuery, Json) ;
			}
		}
		
		function intiGeneralEvent(thisForm_) {
			$('li.groupe').off( "mouseover" ) ;
			$('li.groupe').off( "mouseleave" ) ;
			$('li.groupe').on( "mouseover", function(event) {
				event.stopImmediatePropagation();
				$('li.groupe').removeClass('Hover') ;
				$(this).addClass('Hover') ;
				
			} );
			$('li.groupe').on( "mouseleave", function(event) {
				event.stopImmediatePropagation();
				$('li.groupe').removeClass('Hover') ;
				
			} );
			 /*background: linear-gradient(180deg, rgba(255,0,0,1) 0%, rgba(255,0,0,1) 27%, rgba(5,193,255,1) 28%, rgba(5,193,255,1) 51%, rgba(255,0,0,1) 52%, rgba(255,0,0,1) 77%, rgba(0,0,0,1) 78%, rgba(0,0,0,1) 100%); /* w3c */
			 
			 var $all_li = thisForm_._this.find('li.groupe') ;
			var leng = $all_li.length ;
			if (leng  <= 10 ) {
				leng = 10 ;
			}
			var ratio = 100 / leng / 100 ;
			var prev = 0 ;
			var cssdef = 'linear-gradient(180deg' ; 
			$all_li .each(function(index) {
				var a = (index + 1 ) * ratio ;
				var height = $(this).find('>div').outerHeight(true) ;
				cssdef += ', rgba('+settings.backgroundBaseColor+','+a+') '+prev+'px, rgba('+settings.backgroundBaseColor+','+a+') '+(prev+height)+'px' ;
				prev = prev + height+1 ;
				console.log($(this).next()) ;
				if ($(this).next().length > 0 ) {
					$(this).addClass('hasAnd') ;
					var this_li = $(this) ;
					
					var this_link_and = $(this).find('.link-and-bottom') ;
					
					$(this_link_and).height($(this_li).height() ) ;
					
					
				} else {
					 $(this).removeClass('hasAnd') ;
				}
			});
			//console.log(cssdef) ;
			thisForm_._this.find('div.bg-wrapper').css({background : cssdef+')' }) ;
		}
	
		/*  Find Class by ID
			@Id of Class
			return object of @type Class in specSearch 
		*/
		function getClassById(ClassId) {
			var classObject = null ;
			$.each( specSearch['@graph'], function( key, val ) {
				if ( val['@type'] == 'Class') {
					if ( val['@id'] == ClassId) {
							classObject = val ;
					}
				}
			}) ;
			return classObject ;
		}
		function getClassLabel(ClassId) {
			var classLabel = null ;
			var classObject = getClassById(ClassId) ;
			if (classObject !== null) {
				$.each( classObject['label'], function( key, val ) {
					if (val['@language'] == settings.language ) {
						classLabel = val['@value'] ;
					}
				});
			}
			return classLabel ;
		}
	
		/*  Find Class by ID
			@Id of Class
			return object of @type Class in specSearch 
		*/
		function getObjectPropertyById(ObjectPropertyId) {
			var ObjectPropertyObject = null ;
			$.each( specSearch['@graph'], function( key, val ) {
				if ( val['@type'] == 'ObjectProperty') {
					if ( val['@id'] == ObjectPropertyId) {
							ObjectPropertyObject = val ;
					}
				}
			}) ;
			return ObjectPropertyObject ;
		}
		function getObjectPropertyLabel(ObjectPropertyId) {
			var ObjectPropertyLabel = null ;
			var classObject = getObjectPropertyById(ClassId) ;
			if (classObject !== null) {
				$.each( classObject['label'], function( key, val ) {
					if (val['@language'] == settings.language ) {
						ObjectPropertyLabel = val['@value'] ;
					}
				});
			}
			return ObjectPropertyLabel ;
		}
		
		
		function getClassListSelectFor(classId, inputID, default_value) {
			var list = [] ;
			var items = getAllClassFor(classId) ;
			$.each( items, function( key, val ) {
				var label = getClassLabel(val['@id']) ;
				if (!val['highlightedIconPath'] || 0 === val['highlightedIconPath'].length) {
					val['highlightedIconPath'] = val['iconPath'] ;
				}
				
				var image = ' data-icon="'+val['iconPath']+'" data-iconh="'+val['highlightedIconPath']+'"' ;
				var selected ='';
				if (default_value == val['@id']) {
					selected = 'selected="selected"' ;
				}
				list.push( '<option value="'+val['@id']+'" data-id="'+val['@id']+'"'+image+selected+'>'+ label + '</option>' );

			}) ;
			var html_list = $( "<select/>", {
				"class": "my-new-list input-val",
				"id": 'select-'+inputID,
				html: list.join( "" )
			  });
			return html_list ;
		}
		
		function ClassHaveRange(ClassID) {
			//console.log(getAllClassFor(ClassID)) ;
			if (getAllClassFor(ClassID).length > 0 ) {
				return true;
			} else {
				return false ;
			}
			
		}
		
		function getObjectListSelectFor(domainClassID, rangeClassID, inputID, default_value) {
			var list = [] ;
			var items = getAllObjectPropertyFor(domainClassID,rangeClassID) ;
			$.each( items, function( key, val ) {
				var label = gatLabel(val) ;
				var selected ='';
				if (default_value == val['@id']) {
					selected = 'selected="selected"' ;
				}
				list.push( '<option value="'+val['@id']+'" data-id="'+val['@id']+'"'+selected+'>'+ label + '</option>' );

			}) ;
			var html_list = $( "<select/>", {
				"class": "select-list input-val",
				"id": inputID,
				html: list.join( "" )
			  });
			return html_list ;
		}
		
		
		/*  Find if Class is in objectProperty domain list
			@Id of objectProperty where search
			@Id of Class we will retrive
			return true if  we find the class or false
		*/
		function classIsInDomain(ObjectPropertyId, ClassId) {
			var classIsDomain = false ;
			$.each( specSearch['@graph'], function( key, val ) {
				if ( ( val['@type'] == 'ObjectProperty') &&  (val['@id'] == ObjectPropertyId) ){
					//console.log(val) ;
					if ($.type(val['domain']) === "object") {
						$.each( val['domain']['unionOf']['@list'], function( domkey, domval ) {
							if (domval['@id'] == ClassId ) {
								classIsDomain = true
							}
						}) ;
					} else {
						if (val['domain'] == ClassId ) {
							classIsDomain = true ;
						}
					}
				}
			});
			return classIsDomain;
		}
		/* List of possible Class relative to a Class
			@Id of Class or null if is the first list selection
			return array of @type Class in specSearch 
		*/
		function getAllClassFor(ClassID) {
			var items = [];
			$searchKey = 'range' ;
			if (ClassID === null) {
				$searchKey = 'domain' ;
			}
			//console.log(ClassID) ;
			$.each( specSearch['@graph'], function( key, val ) {
				if ( val['@type'] == 'ObjectProperty') {
					if ($.type(val[$searchKey]) === "object") {
						$.each( val[$searchKey]['unionOf']['@list'], function( domkey, domval ) {
							if (ClassID === null) {
								var item = getClassById(domval['@id']) ;
								items = pushIfNotInArray(item, items);
							} else {
								if (classIsInDomain(val['@id'], ClassID)) {
									var item = getClassById(domval['@id']) ;
									items = pushIfNotInArray(item, items);
								}
							}
						}) ;
					} else {						
						if (ClassID === null) {
								var item = getClassById(val[$searchKey]) ;
								items = pushIfNotInArray(item, items);
						} else {
							//console.log(val['@id']) ;
							if (classIsInDomain(val['@id'], ClassID)) {
								var item = getClassById(val[$searchKey]) ;
								items = pushIfNotInArray(item, items);
							}
						}
					}
				}
			});
			return items ;
		}
		/* List of possible ObjectProperty relative to a Class
			@Id of Class
			return array of @type ObjectProperty in specSearch 
		*/
		function getAllObjectPropertyFor(domainClassID, rangeClassID) {
			var items = [];
			$.each( specSearch['@graph'], function( key, val ) {
				if (domainClassID !== null) {
					var haveDomain = objectPropertyhaveClassLink(val, 'domain' , domainClassID) ;
				} else {
					var haveDomain = true ;
				}
				if (rangeClassID !== null) {
					var haveRange = objectPropertyhaveClassLink(val, 'range', rangeClassID) ;
				} else {
					var haveRange = true ;
				}
				
				
				if ( haveDomain && haveRange) {
					items = pushIfNotInArray(val, items);
				}
			});
			return items ;
		}
		
		function objectPropertyhaveClassLink(graphItem, type, ClassID) {
			var ifHave = false ;
			if ( graphItem['@type'] == 'ObjectProperty') {
					
					
				if ($.type(graphItem[type]) === "object") {
					$.each( graphItem[type]['unionOf']['@list'], function( domkey, domval ) {
						if (domval['@id'] == ClassID ) {
								ifHave = true ;
						}
					}) ;
				} else {
					if (graphItem[type] == ClassID ) {
						ifHave = true ;
					}
				}
			}
			return ifHave ;
		}
		
		function pushIfNotInArray(item, items) {

			if ($.inArray(item, items) < 0) {
				items.push(item) ;
				
			}
			return items ;
			
		}
		
		function addComponent(thisForm_, contexte) {
			
			//console.log(thisForm_.components) ;
			if (thisForm_.components.length > 0 ) {
				var new_index = thisForm_.components[thisForm_.components.length-1].index + 1 ;
			} else {
				var new_index = 0 ;
			}
			
			var classWherePossible = 'addWereEnable' ;
			if (($(contexte).parents('li.groupe').length + 1 ) == (settings.maxDepth - 1) ) {
				classWherePossible = 'addWereDisable' ;
			}
			
			
			var gabari = '<li class="groupe" data-index="'+new_index+'"><span class="link-and-bottom"><span>'+langSearch.And+'</span></span><span class="link-where-bottom"></span><input name="a-'+new_index+'" type="hidden" value=""><input name="b-'+new_index+'" type="hidden" value=""><input name="c-'+new_index+'" type="hidden" value=""></li>' ;
			
			// si il faut desscendre d'un niveau
			if ($(contexte).is('li')) {
				if ($(contexte).find('>ul').length == 0) {
					var ul = $('<ul class="childsList"><div class="lien-top"><span>'+langSearch.Where+'</span></div></ul>').appendTo($(contexte)) ;
					var parent_li = $(ul).parent('li') ;
					var n_width = 0;
					n_width = n_width + GetOffSet( $(parent_li).find('>div>.EndClassGroup'), $(ul) ) - 111 + 15 + 11 + 20 + 5 + 3 ;
					var t_width = GetOffSet( $(parent_li).find('>div>.EndClassGroup'), $(ul) ) + 15 + 11 + 20 + 5  ;
					$(ul).attr('data-test', GetOffSet( $(parent_li).find('>div>.EndClassGroup'), $(ul) ) );
					$(ul).find('>.lien-top').css('width', n_width) ;
					$(parent_li).find('>.link-where-bottom').css('left', t_width) ;
				} else {
					var ul = $(contexte).find('>ul') ;
				}
				
				gabari = $(gabari).appendTo(ul);
				//gabarib = $(gabari).appendTo(contexte) ;
			} else {
				gabari = $(gabari).appendTo(contexte) ;
			}
			$(gabari).addClass(classWherePossible) ;
			
			
			//contexte.html('span') ;
			//gabari = '<div></div>' ;
			//$(contexte).append(gabari) ;
			
			//return $(contexte).find('li[data-index='+new_index+']') ;
			
			
			var UnCritere = new CriteriaGroup({ AncestorHtmlContext: contexte, HtmlContext : gabari, FormContext: thisForm_, ContextComponentIndex: new_index }) ;
			
			
			thisForm_.components.push({index: new_index, CriteriaGroup: UnCritere }) ;
			
			
			
			intiGeneralEvent(thisForm_);
			
			return $(gabari) ;
		}

		function GetOffSet( elem, elemParent ) {
			return elem.offset().left - $(elemParent).offset().left ;
		}

	
	function CriteriaGroup(context) {
		this._this = this ;
		this.thisForm_ = context.FormContext ;
		this.ParentComponent = context.FormContext  ;
		this.ComponentHtml = context.HtmlContext ;
		this.AncestorComponentHtml = context.AncestorHtmlContext ;
		
		
		this.statements = {
			HasAllComplete : false,
			IsOnEdit : false
		}
		this.id =  context.ContextComponentIndex ;
		this.html = $('<div id="CriteriaGroup-'+this.id+'" class="CriteriaGroup"></div>').appendTo(this.ComponentHtml) ;
		
		this.Context = new Context(context) ;
		this.ChildrensCriteriaGroup = new ChildrensCriteriaGroup ;
		
		this.StartClassGroup = new StartClassGroup(this) ;
		
		this.ObjectPropertyGroup = new ObjectPropertyGroup(this) ;
		
		//EndClassGroup.prototype = new GroupContenaire;
		this.EndClassGroup = new EndClassGroup(this) ;
		this.EndClassWidgetGroup = new EndClassWidgetGroup(this) ;
		this.ActionsGroup = new ActionsGroup(this) ;
		//
		
		$(this).trigger( {type:"Created" } ) ;
		
		
		this.initEnd = function () {
			$(this).trigger( {type:"StartClassGroupSelected" } ) ;
		} ;
		
		this.initCompleted = function () {
			$(this.html).parent('li').addClass('completed') ;
		}
		
		this.RemoveCriteria = function() {
			console.log(this) ;
			var index_to_remove = this.id ;
			
			
			$(this.ParentComponent.components).each(function() {
				
				
				var dependantDe = GetDependantCriteria(this.CriteriaGroup.thisForm_, this.index ) ;
					
				if ((dependantDe != null) && (dependantDe.type == 'parent')){
					
					if (dependantDe.element.id == index_to_remove) {
						
						this.CriteriaGroup.RemoveCriteria() ;
					}
				}
				
			}) ;
			
			var dependantDe = GetDependantCriteria(this.thisForm_, this.id ) ;
			
			if (dependantDe === null) {
				
			} else {
				var dependantComponent = dependantDe.element ;
			}
			var formObject = this.thisForm_ ;
			var formContextHtml = this.Context.contexteReference.AncestorHtmlContext;
			
			//remove event listners
			this.ComponentHtml.outerHTML = this.ComponentHtml.outerHTML;
			$(this.ComponentHtml).remove() ;
			
			
			var iteration_to_remove = false ;
			$(this.ParentComponent.components).each(function(i) {
					
				if (this.index == index_to_remove){
					
					iteration_to_remove = i ;
				}
				
			}) ;
			this.ParentComponent.components.splice(iteration_to_remove , 1);
			
			
			if (this.ParentComponent.components.length == 0) {
				console.log(formObject) ;
				var new_component = addComponent(formObject, formContextHtml) ;
			
				$(new_component).find('.nice-select').trigger('click') ;
				
			} else {
				if (dependantDe !== null) {
					if ($(dependantComponent.ComponentHtml).find('li.groupe').length > 0) {
						
						
						
					} else { //Si pas d'enfant, on reaffiche le where action
						
						if ($(dependantComponent.ComponentHtml).hasClass('haveWhereChild') ) {
							$(dependantComponent.ComponentHtml).removeClass('haveWhereChild') ;
							$(dependantComponent.ComponentHtml).removeClass('completed') ;
						}
						$(dependantComponent.ComponentHtml).find('>ul.childsList').remove() ;
					}
				}
				
				
				intiGeneralEvent(formObject) ;
				ExecuteSubmited(formObject) ;
			}
			
			return false ;
		}
		
	}
	function eventProxiCriteria(e) {
		
		var arg1 = e.data.arg1;
		var arg2 = e.data.arg2;
		//console.log(arg1) ;
		//$('.nice-select').removeClass('open') ;
		arg1[arg2]() ;
	}
	
	var GroupContenaire = function () {
		this.ParentComponent = null ;
		this.GroupType = null ;
		this.hasSubvalues = false ;
		this.InputTypeComponent = null ;
		this.tools = null ;
		this.widgetHtml = false ;
		this.html = $() ;
		this.statements = {
			HasInputsCompleted : false,
			IsOnEdit : false
		}
		
		
		//this.tools = new GenericTools(this) ;
		this.init = function() {
			
			if (!this.statements.Created) {
				
				this.statements.IsOnEdit = true ;
				this.HtmlContainer = this.ParentComponent ;
				//this.html.remove() ;
				this.tools = new GenericTools(this) ;
				this.tools.InitHtml() ;
				this.tools.Add() ;
				this.statements.Created = true ;
				
			} else {
				this.tools.Update() ;
			}
			
			
		} ;
		
		function Edit() {
			this.InputTypeComponent.statements.IsOnEdit = true;
			
			
			
			
			/*this.InputTypeComponent.UpdateStatementsClass() ;
			this.InputTypeComponent.AppendInputHtml() ;*/
			
		} this.Edit = Edit ;
		
		
		
	} 
	
	
	var StartClassGroup = function (CriteriaGroupe) {
		this.base = GroupContenaire ;
		this.base() ;
		this.ParentComponent = CriteriaGroupe ;
		this.GroupType = 'StartClassGroup' ;
		//console.log(this) ;
		this.statements.StartClassGroup = true ;
		this.statements.Created = false ;
		//console.log('befor created') ;
		
		//ClassTypeId.prototype = new InputTypeComponent();      // child class inherits from Parent
		//ClassTypeId.prototype.constructor = ClassTypeId; // constructor alignment
		this.InputTypeComponent = new ClassTypeId(this) ;
		
		$(CriteriaGroupe).on('Created', function () {
			//console.log('after created') ;
			$(this.StartClassGroup.html).find('.input-val').unbind('change');
			//this.StartClassGroup.init() ;
			this.StartClassGroup.InputTypeComponent.init() ;
			this.StartClassGroup.Edit() ;
			var select = $(this.StartClassGroup.html).find('.input-val')
			//console.log(selet) ;

			//$(this.html).find('.input-val').change($.proxy(this.initEnd() , null)); 
			this.StartClassGroup.niceslect = $(select).niceSelect() ;
			
			
			$(this.StartClassGroup.html).find('select.input-val').on('change', {arg1: this.StartClassGroup, arg2: 'validSelected'}, eventProxiCriteria);
			
			if ($(this.Context.get().AncestorHtmlContext).is('li')) {
				var ancestorID = parseInt( $(this.Context.get().AncestorHtmlContext).attr('data-index') )  ;
				
				
			}
		}) ;
		function validSelected() {
			//this.niceslect.niceSelect('update') ;
			this.value_selected = $(this.html).find('select.input-val').val() ;
			
			$(this.ParentComponent.StartClassGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update'); 
			//$(this.html).find('.input-val').attr('disabled', 'disabled');
			$(this.ParentComponent).trigger( {type:"StartClassGroupSelected" } ) ;
			
			
		} this.validSelected = validSelected ;
		
		this.init() ;
		
		
	} //StartClassGroup.prototype = new GroupContenaire;
	
	
	
	var ObjectPropertyGroup = function (CriteriaGroupe1) {
		this.base = GroupContenaire ;
		this.base() ;
		this.ParentComponent = CriteriaGroupe1 ;
		this.GroupType = 'ObjectPropertyGroup' ;
		this.statements.ObjectPropertyGroup = true ;
		this.statements.Created = false ;
		this.hasSubvalues = true ;
		this.InputTypeComponent = new ObjectPropertyTypeId(this) ;
		
		$(CriteriaGroupe1).on('EndClassGroupSelected', function () {
			
			$(this.ObjectPropertyGroup.html).find('.input-val').unbind('change');
			//this.ObjectPropertyGroup.init() ;
			this.ObjectPropertyGroup.InputTypeComponent.init() ;
			this.ObjectPropertyGroup.Edit() ;
			
			//console.log(this.ParentComponent) ;
			this.ObjectPropertyGroup.niceslect = $(this.ObjectPropertyGroup.html).find('select.input-val').niceSelect()  ;
			//$('.nice-select').removeClass('open') ;
			$(this.ObjectPropertyGroup.html).find('.nice-select').trigger('click') ;
			$(this.ObjectPropertyGroup.html).find('select.input-val').on('change', {arg1: this.ObjectPropertyGroup, arg2: 'validSelected'}, eventProxiCriteria);
			
			//console.log(this.ObjectPropertyGroup.html);
			if ($(this.ObjectPropertyGroup.html).find('select.input-val').find('option').length == 1) {
				$(this.ObjectPropertyGroup.html).find('.nice-select').trigger('click') ;
			}
			
			
			//console.log('Edit endClassGroup is on ! ') ;
		}) ;
			
		function validSelected() {
			this.value_selected = $(this.html).find('select.input-val').val() ;
			
			$(this.ParentComponent.ObjectPropertyGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update'); 
			 
			$(this.ParentComponent).trigger( {type:"ObjectPropertyGroupSelected" } ) ;
			
			
			var objSpec = getObjectPropertyById(this.value_selected) ;
			
			
			if ( (objSpec.widget["@type"] == TYPE_WIDGET_SEARCH_URI )  || (objSpec.widget["@type"] == TYPE_WIDGET_TIME_URI ) ) {
				
			} else {
				
			}
			
			$(this.ParentComponent.thisForm_._this).trigger( {type:"submit" } ) ;
			
			
		} this.validSelected = validSelected ;
			
		this.init() ;
		
	} //ObjectPropertyGroup.prototype = new GroupContenaire;
	
	
	
	var EndClassGroup = function EndClassGroup(CriteriaGroupe) {
		//GroupContenaire.call(this) ;
		this.base = GroupContenaire ;
		this.base() ;
		this.ParentComponent = CriteriaGroupe ;
		this.GroupType = 'EndClassGroup' ;
		this.statements.EndClassGroup = true ;
		this.statements.Created = false ;
		this.hasSubvalues = true ;
		this.InputTypeComponent = new ClassTypeId(this) ;
		$(CriteriaGroupe).on('StartClassGroupSelected', function () {
			$(this.EndClassGroup.html).find('.input-val').unbind('change');
			$(this.EndClassGroup.html).append('<div class="EditComponents ShowOnHover"></div>');
			//this.EndClassGroup.init() ;
			this.EndClassGroup.InputTypeComponent.init() ;
			this.EndClassGroup.Edit() ;
			
			this.EndClassGroup.niceslect = $(this.EndClassGroup.html).find('select.input-val').niceSelect()  ;
			$(this.EndClassGroup.html).find('.nice-select').trigger('click') ;
			
			$(this.EndClassGroup.html).find('select.input-val').on('change', {arg1: this.EndClassGroup, arg2: 'validSelected'}, eventProxiCriteria);
			
			
		}) ;
		
		function validSelected() {
			this.value_selected = $(this.html).find('select.input-val').val() ;
			
			$(this.ParentComponent.EndClassGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update');
			
			
			if (ClassHaveRange(this.value_selected)) {
				$(this.ParentComponent.html).parent('li').removeClass('WhereImpossible') ;
			} else {
				$(this.ParentComponent.html).parent('li').addClass('WhereImpossible') ;
			}
			$(this.ParentComponent).trigger( {type:"EndClassGroupSelected" } ) ;
			
			
		} this.validSelected = validSelected ;
		
		this.init() ;
		
	} ;// EndClassGroup.prototype = GroupContenaire.prototype;
	
	
	var EndClassWidgetGroup = function (CriteriaGroupe) {
		this.base = GroupContenaire ;
		this.base() ;
		this.ParentComponent = CriteriaGroupe ;
		this.GroupType = 'EndClassWidgetGroup' ;
		this.statements.EndClassWidgetGroup = true ;
		this.statements.Created = false ;
		this.hasSubvalues = true ;
		this.value_selected = [] ;
		
		 this.detectWidgetType = function () {
			
			this.objectPropertyDefinition = getObjectPropertyById(this.ParentComponent.ObjectPropertyGroup.value_selected) ;
			
			this.widgetType = this.objectPropertyDefinition.widget['@type'] ;
			
			
		}  ;
		
		this.InputTypeComponent = new ObjectPropertyTypeWidget(this) ;
		
		
		$(CriteriaGroupe).on('ObjectPropertyGroupSelected', function () {
			//console.log(this.StartClassGroup) ;
			// ;
			//console.log('Init  EndClassWidgetGroup -----------------------------------------------------------------------------------------------') ;
			this.EndClassWidgetGroup.detectWidgetType() ;
			this.EndClassWidgetGroup.InputTypeComponent.HtmlContainer.html = $(this.EndClassGroup.html).find('.EditComponents') ;
			this.EndClassWidgetGroup.InputTypeComponent.init() ;
			
			//console.log(this.EndClassWidgetGroup.InputTypeComponent) ;
			$(this.EndClassWidgetGroup.InputTypeComponent).on('change', {arg1: this.EndClassWidgetGroup, arg2: 'validSelected'}, eventProxiCriteria);
			
			
			//console.log('Edit endClassWidgetGroup is on ! ') ;
		}) ;
		
		function validSelected() {
			var temp_value = this.InputTypeComponent.GetValue() ;
			if (temp_value == null ) {
				return false ;
			}
			if (this.value_selected.length > 0) {

				
				if (Object.onArray(this.value_selected, temp_value) == true) {
					return false ;
				}
			}
			
			this.value_selected.push(this.InputTypeComponent.GetValue()) ;
			this.LabelValueSelected = this.InputTypeComponent.GetValueLabel() ;
			//$(this.ParentComponent.StartClassGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update'); 
			
			if ($(this.ParentComponent.html).find('.EndClassWidgetGroup>div').length == 0) {
				$(this.ParentComponent.html).find('.EndClassWidgetGroup').append('<div class="EndClassWidgetValue"><span class="triangle-h"></span><span class="triangle-b"></span><p>'+this.LabelValueSelected+'</p></div>') ;
			} else {
				$(this.ParentComponent.html).find('.EndClassWidgetGroup >.EndClassWidgetAddOrValue').before('<div class="EndClassWidgetValue"><span class="triangle-h"></span><span class="triangle-b"></span><p>'+this.LabelValueSelected+'</p></div>') ;
			}
			
			
			$(this.ParentComponent.html).parent('li').addClass('WhereImpossible') ;
			
			this.ParentComponent.initCompleted() ;
			
			$(this.ParentComponent).trigger( {type:"EndClassWidgetGroupSelected" } ) ;
			$(this.ParentComponent.thisForm_._this).trigger( {type:"submit" } ) ;
			
			
			if ( VALUE_SELECTION_WIDGETS.indexOf(this.InputTypeComponent.widgetType) !== -1 ) {
				if ($(this.ParentComponent.html).find('.EndClassWidgetGroup>div').length == 1) {
					$(this.ParentComponent.html).find('.EndClassWidgetGroup').append('<div class="EndClassWidgetAddOrValue"><span class="triangle-h"></span><span class="triangle-b"></span><p><span>+</span></p></div>') ;
					$(this.ParentComponent.html).find('.EndClassWidgetGroup>.EndClassWidgetAddOrValue').on('click', {arg1: this, arg2: 'needAddOrValue'}, eventProxiCriteria);
				}
			}
			//Plus d'ajjout possible si nombre de valeur suppérieur à l'option maxOr
			if (this.value_selected.length == settings.maxOr) {
				$(this.ParentComponent.html).find('.EndClassWidgetGroup .EndClassWidgetAddOrValue').hide() ;
			}
			
			$(this.ParentComponent.html).find('.EndClassGroup>.EditComponents').removeClass('newOr') ;
			
			
			intiGeneralEvent(this.ParentComponent.thisForm_);
			
		} this.validSelected = validSelected ;
		
		function needAddOrValue() {
			$(this.ParentComponent.html).find('.EndClassGroup>.EditComponents').addClass('newOr') ;
			
		} this.needAddOrValue = needAddOrValue ;
		
		this.init() ;
		
	} //EndClassWidgetGroup.prototype = new GroupContenaire;
	
	
	function ActionsGroup(CriteriaGroupe) {
		this.base = GroupContenaire ;
		this.base() ;
		this.ParentComponent = CriteriaGroupe ;
		this.GroupType = 'ActionsGroup' ;
		this.statements.ActionsGroup = true ;
		this.statements.Created = false ;
		this.hasSubvalues = true ;
		
		function detectWidgetType() {
			
			this.widgetType = 'Actions' ;
			
		} this.detectWidgetType = detectWidgetType ;
		
		this.InputTypeComponent = { ActionWhere: new ActionWhere(this), ActionAnd: new ActionAnd(this), ActionRemove: new ActionRemove(this) } ;
		
		$(CriteriaGroupe).on('Created', function () {
			//console.log(this.StartClassGroup) ;
			// ;
			this.ActionsGroup.detectWidgetType() ;
			this.ActionsGroup.InputTypeComponent.ActionRemove.init() ;
			
			$(this.ActionsGroup.InputTypeComponent.ActionRemove.html).find('a').on('click', {arg1: this, arg2: 'RemoveCriteria'}, eventProxiCriteria);
			
			//console.log('Edit ActionRemove is on ! ') ;
		}) ;
		
		$(CriteriaGroupe).on('ObjectPropertyGroupSelected', function () {
			//console.log(this.StartClassGroup) ;
			// ;
			this.ActionsGroup.detectWidgetType() ;
			
			//console.log($(this.EndClassGroup) ) 
			this.ActionsGroup.InputTypeComponent.ActionWhere.HtmlContainer.html = $(this.EndClassGroup.html).find('.EditComponents') ;
			this.ActionsGroup.InputTypeComponent.ActionWhere.init() ;
			this.ActionsGroup.InputTypeComponent.ActionAnd.init() ;
			
			$(this.ActionsGroup.InputTypeComponent.ActionWhere.html).find('a').on('click', {arg1: this.ActionsGroup, arg2: 'AddWhere'}, eventProxiCriteria);
			$(this.ActionsGroup.InputTypeComponent.ActionAnd.html).find('a').on('click', {arg1: this.ActionsGroup, arg2: 'AddAnd'}, eventProxiCriteria);
			
			intiGeneralEvent(this.thisForm_);
			//console.log('Edit ActionWhere et ActionAnd is on ! ') ;
		}) ;
		
		this.AddWhere = function () {
			
			this.ParentComponent.html.parent('li').addClass('haveWhereChild') ;
			this.ParentComponent.initCompleted() ;
			
			var new_component = addComponent(this.ParentComponent.thisForm_, this.ParentComponent.Context.contexteReference.HtmlContext) ;
			
			$(new_component).find('.nice-select').trigger('click') ;
			$(new_component).find('.nice-select').trigger('click') ;
			
			//$(new_component).find('.nice-select').trigger('change') ;
			//new_component.appendTo(this.ParentComponent.Context.HtmlContext) ;
			
			//this.value_selected = $(this.html).find('.input-val').val() ;
			//$(this.ParentComponent.StartClassGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update'); 
			//$(this.ParentComponent).trigger( {type:"EndClassGroupSelected" } ) ;
			
			//return false ;
			
			
			
		}
		this.AddAnd = function () {
			
			//this.ParentComponent.initCompleted() ;
			
			
			var new_component = addComponent(this.ParentComponent.thisForm_, this.ParentComponent.Context.contexteReference.AncestorHtmlContext) ;
			
			$(new_component).find('.nice-select').trigger('click') ;
			$(new_component).find('.nice-select').trigger('click') ;
			//this.value_selected = $(this.html).find('.input-val').val() ;
			//$(this.ParentComponent.StartClassGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update'); 
			//$(this.ParentComponent).trigger( {type:"EndClassGroupSelected" } ) ;
			
			return false ;
			
		}
		function validSelected() {
			//this.value_selected = $(this.html).find('.input-val').val() ;
			//$(this.ParentComponent.StartClassGroup.html).find('.input-val').attr('disabled', 'disabled').niceSelect('update'); 
			//$(this.ParentComponent).trigger( {type:"EndClassGroupSelected" } ) ;
			
		} this.validSelected = validSelected ;
		
		this.init() ;
		
	} //ActionsGroup.prototype = new GroupContenaire;
	
	var GetDependantCriteria = function (thisForm_, id) {
		var dependant = null ;
		var dep_id = null ;
		var element = thisForm_._this.find('li[data-index="'+id+'"]') ;
		
		if ($(element).parents('li').length > 0) {
			
		dep_id = $($(element).parents('li')[0]).attr('data-index') ;
			dependant = {type : 'parent'}  ;
			
		} else {
			if ($(element).prev().length > 0) {
				dep_id = $(element).prev().attr('data-index') ;
				dependant = {type : 'sibling'}  ;
				
			} else {
				
			}
		}
		$(thisForm_.components).each(function(index) {
			
			if (this.index == dep_id) {
				dependant.element = this.CriteriaGroup ;
			}
			
		}) ;
		return dependant ;
		
	}
	
	var InputTypeComponent = function () {
		
		this.ParentComponent = null ;
		this.statements = {
			IsCompleted : false,
			IsOnEdit : false
		}
		
		this.possibleValue ;
		this.tools = null ;
		this.value = null ;
		
		
		
		
		
		
		
		this.init = function () {
			
			//If Start Class 
			if (this.statements.Created) {
				this.tools.Update() ;
				return true ;
			}
			var trigger = null ;
			var possible_values = null ;
			var default_value = null ;
			var id = this.ParentComponent.ParentComponent.id ;
			if (this.ParentComponent instanceof StartClassGroup) {
				
				var dep_element = GetDependantCriteria(this.ParentComponent.ParentComponent.thisForm_, id) ;
				if (dep_element) {
					if (dep_element.type == 'parent' ) {
						default_value = dep_element.element.EndClassGroup.value_selected ;
					} else {
						default_value = dep_element.element.StartClassGroup.value_selected ;
					}
					this.statements.Highlited = false ;
				} else {
					this.statements.Highlited = true ;
				}
				
				possible_values = getClassListSelectFor(null, 'a-'+id, default_value) ;
				
			} 
			
			if (this.ParentComponent instanceof EndClassGroup) {
				var startClassGroup = this.ParentComponent.ParentComponent.StartClassGroup ;
				possible_values = getClassListSelectFor(startClassGroup.value_selected, 'b-'+id) ;
			}
			
			if (this.ParentComponent instanceof ObjectPropertyGroup) {
				var startClassGroup = this.ParentComponent.ParentComponent.StartClassGroup ;
				var endClassGroup = this.ParentComponent.ParentComponent.EndClassGroup ;
				possible_values = getObjectListSelectFor(startClassGroup.value_selected, endClassGroup.value_selected, 'c-'+id) ;
			}
			
			if (this.ParentComponent instanceof ActionsGroup) {
				
				if (this instanceof ActionWhere) {
					var endClassGroup = this.ParentComponent.ParentComponent.EndClassGroup ;
					var endLabel = getClassLabel(endClassGroup.value_selected) ;
					var widgetLabel = '<span class="edit-trait"><span class="edit-num">2</span></span>'+langSearch.Search+' '+ endLabel + ' '+langSearch.That+'...' ;
					
					
					possible_values = widgetLabel+'<a>+</a>' ;
				}
				if (this instanceof ActionAnd) {
					possible_values = '<span class="trait-and-bottom"></span><a>'+langSearch.And+'</a>' ;
				}
				if (this instanceof ActionRemove) {
					possible_values = '<a><img src="assets/icons/buttons/remove.png"></a>' ;
				}
				
			} 
			
			
			this.widgetHtml = possible_values ;
			this.statements.IsOnEdit = true ;
			this.tools = new GenericTools(this) ;
			this.tools.InitHtml() ;
			this.tools.Add() ;
			this.statements.Created = true ;
			if (trigger) {
				//console.log(trigger) 
				//$(this.widgetHtml).trigger('change') ;
			}
			
		}  ;
		
	} ;
	
	
	function ActionWhere(GroupContenaire) {
		this.base = InputTypeComponent ;
		this.base() ;
		this.ParentComponent = GroupContenaire ;
		this.statements.ActionWhere = true ;
		this.statements.ShowOnHover = true ;
		this.statements.Created = false ;
		this.HtmlContainer = {} ;
		
		
		
		
		//this.widgetHtml = 'hohohoh' ;
		//this.html = '<div class="ClassTypeId"></div>' ;
		
	} //ActionWhere.prototype = new InputTypeComponent;
	
	
	function ActionAnd(GroupContenaire) {
		this.base = InputTypeComponent ;
		this.base() ;
		this.ParentComponent = GroupContenaire ;
		this.statements.ActionAnd = true ;
		this.statements.ShowOnHover = true ;
		this.statements.Created = false ;
		this.HtmlContainer = this.ParentComponent ;
		
		
		//this.widgetHtml = 'hohohoh' ;
		//this.html = '<div class="ClassTypeId"></div>' ;
		
	} //ActionAnd.prototype = new InputTypeComponent;
	
	
	function ActionRemove(GroupContenaire) {
		this.base = InputTypeComponent ;
		this.base() ;
		this.ParentComponent = GroupContenaire ;
		this.statements.ActionRemove = true ;
		this.statements.Created = false ;
		this.HtmlContainer = this.ParentComponent ;
		
		
		
		//this.widgetHtml = 'hohohoh' ;
		//this.html = '<div class="ClassTypeId"></div>' ;
		
	} //ActionRemove.prototype = new InputTypeComponent;
	
	var ClassTypeId = function (GroupContenaire) {
		this.base = InputTypeComponent ;
		this.base() ;
		this.ParentComponent = GroupContenaire ;
		this.HtmlContainer = this.ParentComponent ;
		this.statements.Highlited = true ;
		this.statements.Created = false ;
		
		
		
		
		
		//this.widgetHtml = 'hohohoh' ;
		//this.html = '<div class="ClassTypeId"></div>' ;
		
	} ; //ClassTypeId.prototype = new InputTypeComponent;




	function ClassTypeId2(GroupContenaire) {
		console.log('new classTypeId2--------------------------------------------------------------------------------------------------------------------------------------') ;
		
		this.base = InputTypeComponent ;
		this.base() ;
		console.log(this) ;
		this.ParentComponent = GroupContenaire ;
		this.HtmlContainer = this.ParentComponent ;
		this.statements.Highlited = true ;
		this.statements.Created = false ;
		
		
		
		
		//this.widgetHtml = 'hohohoh' ;
		//this.html = '<div class="ClassTypeId"></div>' ;
		
	} //ClassTypeId2.prototype = new InputTypeComponent;
	
	
	function ObjectPropertyTypeId(GroupContenaire) {
		this.base = InputTypeComponent ;
		this.base() ;
		this.ParentComponent = GroupContenaire ;
		this.html = '<div class="ObjectPropertyTypeId"></div>' ;
		this.widgetHtml = null ;
		this.HtmlContainer = this.ParentComponent ;
		this.statements.Created = false ;
		
	} //ObjectPropertyTypeId.prototype = new InputTypeComponent;
	
		
	function ObjectPropertyTypeWidget(GroupContenaire) {
		this.base = InputTypeComponent ;
		this.base() ;
		this.ParentComponent = GroupContenaire ;
		this.html = '<div class="ObjectPropertyTypeWidget"></div>' ;
		this.widgetHtml = null ;
		this.widgetType = null ;
		this.HtmlContainer = this.ParentComponent ;
		this.statements.Created = false ;
		
		console.log(this) ;
		
		function init() {
			console.log(this) ;
			if (this.ParentComponent instanceof EndClassWidgetGroup) {
				if (this.statements.Created) {
					this.tools.Update() ;
					return true ;
				}
				var startClassGroup = this.ParentComponent.ParentComponent.StartClassGroup ;
				var endClassGroup = this.ParentComponent.ParentComponent.EndClassGroup ;

				console.log(endClassGroup) ;
				if (endClassGroup.value_selected == LABEL_URI) {
					var endLabel = getClassLabel(endClassGroup.value_selected) ;
				} else {
					var endLabel = langSearch.Find+' '+getClassLabel(endClassGroup.value_selected) ;
				}
				var widgetLabel = '<span class="edit-trait first"><span class="edit-trait-top"></span><span class="edit-num">1</span></span>'+ endLabel ;
				
				this.widgetType = this.ParentComponent.widgetType  ;
				this.getWigetTypeClassName() ;
				this.widgetHtml = widgetLabel + this.widgetComponent.html ;
				
			
				this.statements.IsOnEdit = true ;
				this.tools = new GenericTools(this) ;
				this.tools.InitHtml() ;
				this.tools.Add() ;
				this.widgetComponent.init() ;
				this.statements.Created = true ;
			}
			
			
		} this.init = init
		
;		function getWigetTypeClassName() {
			switch (this.widgetType) {
			  case TYPE_WIDGET_LIST_URI:
				this.widgetComponent = new ListWidget(this) ;
				break;
			  case TYPE_WIDGET_AUTOCOMPLETE_URI:
				this.widgetComponent = new autoCompleteWidget(this) ;
			    break;
			  case TYPE_WIDGET_TIME_URI:
				//console.log('Mangoes and papayas are $2.79 a pound.');
				this.widgetComponent = new DatesWidget(this) ;
				// expected output: "Mangoes and papayas are $2.79 a pound."
				break;
			  case TYPE_WIDGET_SEARCH_URI:
				//console.log('Mangoes and papayas are $2.79 a pound.');
				this.widgetComponent = new SearchWidget(this) ;
				// expected output: "Mangoes and papayas are $2.79 a pound."
				break;
			  default:
				//console.log('Sorry, we are out of ' + expr + '.');
			}
		} this.getWigetTypeClassName = getWigetTypeClassName ;
		
		this.GetValue = function () {
			
			var value_widget = null ;
			switch (this.widgetType) {
			  case TYPE_WIDGET_LIST_URI:
			  var id_input = '#ecgrw-'+ this.widgetComponent.IdCriteriaGroupe +'-input-value' ;
				value_widget = $(id_input).val() ;
				console.log(value_widget) ;
				break;
			  case TYPE_WIDGET_AUTOCOMPLETE_URI:
				var id_input = '#ecgrw-'+ this.widgetComponent.IdCriteriaGroupe +'-input-value' ;
				value_widget = $(id_input).val() ;
				console.log(value_widget) ;
			    break;
			  case TYPE_WIDGET_TIME_URI:
				//console.log('Mangoes and papayas are $2.79 a pound.');
				var id_input = '#ecgrw-date-'+ this.widgetComponent.IdCriteriaGroupe +'-input' ;
				
				value_widget = { start: $(id_input+'-start').val() , stop: $(id_input+'-stop').val()  } ;
				
				if ((value_widget.start == '') || (value_widget.stop == '')) {
						value_widget = null ;
				} else {
					if (parseInt(value_widget.start) > parseInt(value_widget.stop)) {
						value_widget = null ;
					}
				}
				
				// expected output: "Mangoes and papayas are $2.79 a pound."
				break;
			  case TYPE_WIDGET_SEARCH_URI:
				//console.log('Mangoes and papayas are $2.79 a pound.');
				var id_input = '#ecgrw-search-'+ this.widgetComponent.IdCriteriaGroupe +'-input-value' ;
				value_widget = $(id_input).val() ;
				// expected output: "Mangoes and papayas are $2.79 a pound."
				break;
			  default:
				//console.log('Sorry, we are out of ' + expr + '.');
			}
			return value_widget ;
		}
		this.GetValueLabel = function () {
			
			var value_widget = null ;
			switch (this.widgetType) {
			  case TYPE_WIDGET_LIST_URI:
			  var id_input = '#ecgrw-'+ this.widgetComponent.IdCriteriaGroupe +'-input-value' ;
				value_widget = '<span>' +$(id_input).find('option:selected').text() + '</span>' ;
				break;
			  case TYPE_WIDGET_AUTOCOMPLETE_URI:
				var id_input = '#ecgrw-'+ this.widgetComponent.IdCriteriaGroupe +'-input' ;
				value_widget = '<span>' + $(id_input).val()  + '</span>' ;
				//console.log(value_widget) ;
			    break;
			  case TYPE_WIDGET_TIME_URI:
				
				var id_input = '#ecgrw-date-'+ this.widgetComponent.IdCriteriaGroupe +'-input' ;
				//console.log(id_input);
				value_widget = '<span class="label-two-line">De '+ $(id_input+'-start').val() +' à '+ $(id_input+'-stop').val() + '<br/>(' + $(id_input).val() + ')</span>' ;
				break;
			  case TYPE_WIDGET_SEARCH_URI:
				
				var id_input = '#ecgrw-search-'+ this.widgetComponent.IdCriteriaGroupe +'-input-value' ;
				//console.log(id_input);
				value_widget = '<span>'+ $(id_input).val() +'</span>' ;
				break;
				
			  default:
			  
			}
			return value_widget ;
		}
		
	} //ObjectPropertyTypeWidget.prototype = new InputTypeComponent;
	
	
	
	
	function widgetType() {
		
		this.parentComponent = null ;
		this.html = null ;
		
		
		
	}
	
	function autoCompleteWidget(InputTypeComponent) {
		this.base = widgetType ;
		this.base() ;
		this.ParentComponent = InputTypeComponent ;
		this.ParentComponent.statements.AutocompleteWidget  = true ;
		
		this.IdCriteriaGroupe = this.ParentComponent.ParentComponent.ParentComponent.id ;
		
		
		
		this.html = '<input id="ecgrw-'+this.IdCriteriaGroupe+'-input" /><input id="ecgrw-'+this.IdCriteriaGroupe+'-input-value" type="hidden"/>' ;
		
		function init() {
			var startClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.StartClassGroup.value_selected ;
			var endClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.EndClassGroup.value_selected ;
			var ObjectPropertyGroup_value = this.ParentComponent.ParentComponent.ParentComponent.ObjectPropertyGroup.value_selected ;
			
			var id_inputs = this.IdCriteriaGroupe ;
			
			var itc_obj = this.ParentComponent;
			
			var isMatch = settings.autocomplete.enableMatch(startClassGroup_value, ObjectPropertyGroup_value, endClassGroup_value);
			
			var options = {
				ajaxSettings: {crossDomain: true, type: 'GET'} ,
				url: function(phrase) {
					return settings.autocomplete.url(startClassGroup_value, ObjectPropertyGroup_value, endClassGroup_value, phrase) ;
				},
				listLocation: function (data) { return settings.autocomplete.listLocation(startClassGroup_value, ObjectPropertyGroup_value, endClassGroup_value, data) ; },
				
				
				 getValue: function (element) { return settings.autocomplete.elementLabel(element) ; },

				  ajaxSettings: {
					dataType: "json",
					method: "GET",
					data: {
					  dataType: "json"
					}
				  },

				  preparePostData: function(data) {
					data.phrase = $('#ecgrw-'+id_inputs+'-input').val();
					return data;
				  },
				  list: {
				  	match: {
				  		enabled: isMatch
				  	},
					onChooseEvent: function() {
							var value = $('#ecgrw-'+id_inputs+'-input').getSelectedItemData();
							
							var label = settings.autocomplete.elementLabel(value) ; 
							var uri = settings.autocomplete.elementUri(value) ; 
							$('#ecgrw-'+id_inputs+'-input').val(label)
							$('#ecgrw-'+id_inputs+'-input-value').val(uri).trigger("change");$(itc_obj).trigger("change");
							
					}
				  },

				  requestDelay: 400
			};
			//Need to add in html befor
			
			$('#ecgrw-'+id_inputs+'-input').easyAutocomplete(options);
			
			
		} this.init = init ;
		
		
		
	} //autoCompleteWidget.prototype = new widgetType;
	
	function ListWidget(InputTypeComponent) {
		this.base = widgetType ;
		this.base() ;
		this.ParentComponent = InputTypeComponent ;
		this.ParentComponent.statements.ListeWidget = true ;
		this.IdCriteriaGroupe = this.ParentComponent.ParentComponent.ParentComponent.id ;
		
		var id_input = 'ecgrw-'+ this.IdCriteriaGroupe +'-input-value' ;
		
		
		this.html = '<div class="list-widget"><select id="'+id_input+'"></select></div>' ;
		this.select = $('<select id="'+id_input+'"></select>');
		
		function init() {
			var startClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.StartClassGroup.value_selected ;
			var endClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.EndClassGroup.value_selected ;
			var ObjectPropertyGroup_value = this.ParentComponent.ParentComponent.ParentComponent.ObjectPropertyGroup.value_selected ;
			
			var itc_obj = this.ParentComponent;
			var options = {

				url: settings.list.url(startClassGroup_value, ObjectPropertyGroup_value, endClassGroup_value),
				dataType: "json",
				method: "GET",
				data: {
					  dataType: "json"
				}
			} ;
			
			var request = $.ajax( options );
			var select = $(this.html).find('select') ;
			request.done(function( data ) {
			  
			  var items = settings.list.listLocation(startClassGroup_value, ObjectPropertyGroup_value, endClassGroup_value, data) ;
			  $.each( items, function( key, val ) {
				  
					var label = settings.list.elementLabel(val) ; 
					var uri = settings.list.elementUri(val) ; 
				$('#'+id_input).append( "<option value='" + uri + "'>" + label + "</option>" );
			  });
			  $('#'+id_input).niceSelect();
			  $('#'+id_input).on("change", function() {
				  $(itc_obj).trigger('change') ;
			  });
			  //$(this.ParentComponent).trigger("change");
			  
			});
				
			//Need to add in html befor
			
			
			
			
		} this.init = init ;
		
		
		
	} //ListWidget.prototype = new widgetType;
	
	function DatesWidget(InputTypeComponent) {
		this.base = widgetType ;
		this.base() ;
		this.ParentComponent = InputTypeComponent ;
		this.ParentComponent.statements.DatesWidget  = true ;
		this.IdCriteriaGroupe = this.ParentComponent.ParentComponent.ParentComponent.id ;
		
		this.html = '<div class="date-widget"><input id="ecgrw-date-'+this.IdCriteriaGroupe+'-input" placeholder="'+langSearch.PlaceHolderDatePeriod+'" /><input id="ecgrw-date-'+this.IdCriteriaGroupe+'-input-start" placeholder="'+langSearch.PlaceHolderDateFrom+'"/><input id="ecgrw-date-'+this.IdCriteriaGroupe+'-input-stop" placeholder="'+langSearch.PlaceHolderDateTo+'" /><input id="ecgrw-date-'+this.IdCriteriaGroupe+'-input-value" type="hidden"/><button class="button-add" id="ecgrw-date-'+this.IdCriteriaGroupe+'-add">'+langSearch.ButtonAdd+'</button></div>' ;
		
		function init() {
			var startClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.StartClassGroup.value_selected ;
			var endClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.EndClassGroup.value_selected ;
			var ObjectPropertyGroup_value = this.ParentComponent.ParentComponent.ParentComponent.ObjectPropertyGroup.value_selected ;
			var phrase ="" ;
			var data_json = null ;
			
			var id_inputs = this.IdCriteriaGroupe ;
			
			var itc_obj = this.ParentComponent;
			
			
			$.ajax({
				url: settings.dates.url(startClassGroup_value, ObjectPropertyGroup_value, endClassGroup_value, phrase) ,
				async: false,
				success: function (data){
					data_json = data;
				}
			});
			
			
				var options = {
					
						data: data_json ,
				
					 getValue: function (element) { return settings.dates.elementLabel(element) ; },
					 /*getValue: function(element) {
						 //console.log(element) ;
						return element.label+' '+element.synonyms.join(' '); // +'' convert array to string ; https://stackoverflow.com/questions/5289403/jquery-convert-javascript-array-to-string
					  },*/

					 
					list: {
						match: {
							enabled: true
						},

						onChooseEvent: function() {
							
							var values = $('#ecgrw-date-'+id_inputs+'-input').getSelectedItemData();
							var value = settings.dates.elementLabel(values) ;
							var start = settings.dates.elementStart(values) ;
							var stop = settings.dates.elementEnd(values) ;

							$('#ecgrw-date-'+id_inputs+'-input').val(value).trigger("change");
							$('#ecgrw-date-'+id_inputs+'-input-start').val(start).trigger("change");
							$('#ecgrw-date-'+id_inputs+'-input-stop').val(stop).trigger("change");
							
							$('#ecgrw-'+id_inputs+'-input-value').val(value).trigger("change");
						}
					},
					 template: {
						type: "custom",
						method: function(value, item) {
							
							var label = settings.dates.elementLabel(item) ;
							var start = settings.dates.elementStart(item) ;
							var stop = settings.dates.elementEnd(item) ;
							
							
							return '<div>' + label + ' <span class="start">' + start + '</span><span class="end">' + stop + '</span></div>';
						}
					},

					requestDelay: 400
				};
				//Need to add in html befor
				
				$('#ecgrw-date-'+id_inputs+'-input').easyAutocomplete(options);
				$('#ecgrw-date-'+this.IdCriteriaGroupe+'-add').on('click', function() {
					$(itc_obj).trigger("change");
				})
			
			
		} this.init = init ;
		
		
		
	} //DatesWidget.prototype = new widgetType;
	function SearchWidget(InputTypeComponent) {
		this.base = widgetType ;
		this.base() ;
		this.ParentComponent = InputTypeComponent ;
		this.ParentComponent.statements.SearchWidget  = true ;
		this.IdCriteriaGroupe = this.ParentComponent.ParentComponent.ParentComponent.id ;
		
		this.html = '<div class="search-widget"><input id="ecgrw-search-'+this.IdCriteriaGroupe+'-input-value" /><button id="ecgrw-search-'+this.IdCriteriaGroupe+'-add" class="button-add">'+langSearch.ButtonAdd+'</button></div>' ;
		
		function init() {
			var startClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.StartClassGroup.value_selected ;
			var endClassGroup_value = this.ParentComponent.ParentComponent.ParentComponent.EndClassGroup.value_selected ;
			var ObjectPropertyGroup_value = this.ParentComponent.ParentComponent.ParentComponent.ObjectPropertyGroup.value_selected ;
			var phrase ="" ;
			var data_json = null ;
			
			var id_inputs = this.IdCriteriaGroupe ;
			
			var itc_obj = this.ParentComponent;
			
			var EndClassGroupObject = this.ParentComponent.ParentComponent.ParentComponent.EndClassGroup ;
			
		
				//Need to add in html befor

				$('#ecgrw-search-'+this.IdCriteriaGroupe+'-add').on('click', function() {
					$('#ecgrw-search-'+id_inputs+'-input-value').trigger("change");
					$(itc_obj).trigger("change");
					$(EndClassGroupObject.html).find('.ClassTypeId').hide() ;
				})
			
			
		} this.init = init ;
		
		
		
	} //DatesWidget.prototype = new widgetType;
	
	
	function GenericTools(component) {
		this.component = component ;
		this.component.inserted = false ;
		
		function AppendComponentHtml() {
			if (!this.component.inserted ) {
				this.component.html = $(this.component.html).appendTo(this.component.HtmlContainer.html) ;
				this.component.inserted = true;
			}
			
		} this.AppendComponentHtml = AppendComponentHtml ;
		
		function UpdateStatementsClass() {
			
			//var html = this.component.html ;
			for (var item in this.component.statements) {
				
				if (this.component.statements[item] === true) {
					
					$(this.component.html).addClass(item) ;
				} else {
					$(this.component.html).removeClass(item) ;
				}
				
			}
			//console.log(this.component.html) ;
			//this.component.html = html ;
		} this.UpdateStatementsClass = UpdateStatementsClass ;
		
		function Add() {
			this.UpdateStatementsClass() ;
			if (!this.component.inserted) {
				this.AppendComponentHtml() ;
			}

		} this.Add = Add ;
		
		function Update() {
			this.UpdateStatementsClass() ;
		} this.Update = Update ;
		
		function InitHtml() {
			var instance = this.component.constructor.name ;
			var widget = this.component.widgetHtml ;
			this.component.html = $('<div class="'+instance+' ddd"></div>') ; 
			if (widget) {
				this.component.html.append(widget) ; 
			}
			
			
		} this.InitHtml = InitHtml ;
	}
	
	
	function Context(context) {
		
		this.contexteReference = context;
		this.hasContext = false;
		
		if (context !== null) {
			this.hasContext = true;
		}
		
		function get() {
			return this.contexteReference ;
		}
		this.get = get ;
	}
	
	function ChildrensCriteriaGroup() {
		this.childrensReferences = [];
		
		function get() {
			return this.contexteReferences ;
		}
		this.get = get ;
		
		
		function add(children) {
			this.childrensReferences.push(children) ;
			//console.log(this.childrensReferences ) ;
		}
		this.add = add;
	}

	return this ;
}

Object.onArray = function (arrayTosearch, objectTocompare) {
	//console.log(arrayTosearch) ;
	//console.log(objectTocompare) ;
	var objectTocompare = objectTocompare ;
	var temp_return = false ;
	$.each( arrayTosearch, function( key, val ) {
		
		if (Object.compare(val, objectTocompare)) {
			temp_return = true;
		}
	}) ;
	return temp_return ;
} ;

Object.compare = function (obj1, obj2) {
	//Loop through properties in object 1
	for (var p in obj1) {
		//Check property exists on both objects
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;
 
		switch (typeof (obj1[p])) {
			//Deep compare objects
			case 'object':
				if (!Object.compare(obj1[p], obj2[p])) return false;
				break;
			//Compare function code
			case 'function':
				if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
				break;
			//Compare values
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}
 
	//Check object 2 for any extra properties
	for (var p in obj2) {
		if (typeof (obj1[p]) == 'undefined') return false;
	}
	return true;
};

	
 
}( jQuery ));