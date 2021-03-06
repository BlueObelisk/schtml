/*

COPYRIGHT Peter Malcolm Sefton 2011

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.



*/

//TODO - capture everything after "-" in a style name and use a class on generated p or h








function word2HML5Factory(jQ) {

	word2html = {};
	config = {};
        config.preMatch = /(courier)|(monospace)/i;
	config.headingMatches = [
		[/H(ead)?(ing)? ?1.*/i , "<h2>", 3],
		[/H(ead)?(ing)? ?2.*/i , "<h3>", 4],
		[/H(ead)?(ing)? ?3.*/i , "<h4>", 5],
		[/H(ead)?(ing)? ?4.*/i , "<h5>", 6],
		[/^(mso)?title/i, "<h1 rel='title'>", 2]
	]		
	



	function stateFactory(topLevelContainer) {


		 //Make the assumption Normal has zero indent
		  //TODO work out zero indent from Normal style (and deal with negative indents?)
		var state = {};
		state.indentStack = [0]; //indents in px
	 	state.elementStack = [topLevelContainer]; //elements
		state.headingLevelStack = [1]; //integers
		state.headingContainerStack = [topLevelContainer]; //elements
		state.headingLevel = 1;
		state.currentIndent = 0;
		function setCurrentIndent(indent) {
			state.currentIndent = indent;
		}
		state.setCurrentIndent = setCurrentIndent;

		function setHeadinglevel(indent) {
			state.headingLevel = indent;
		}
		state.setHeadinglevel = setHeadinglevel;

		function nestingNeeded() {
			//Test whether current left=margin indent means we should add some nesting
			return(state.currentIndent > state.indentStack[state.indentStack.length-1]);
		
		}
		state.nestingNeeded = nestingNeeded;

		function headingNestingNeeded() {
			//Test whether current left-margin indent means we should add some nesting
			
			needed =state.headingLevel > state.headingLevelStack[state.headingLevelStack.length-1];
			
			return(needed);
		
		}
		state.headingNestingNeeded = headingNestingNeeded;


		function levelDown() {
			while (state.currentIndent < state.indentStack[state.indentStack.length-1]) {
				popState();
			}
			
		}
		state.levelDown = levelDown;

		function headingLevelDown() {
			
			while (state.headingLevel <= state.headingLevelStack[state.headingLevelStack.length-1]) {
				popHeadingState();
				
			}
			
			
		}
		state.headingLevelDown = headingLevelDown;

		function getCurrentContainer() {
			return state.elementStack[state.elementStack.length-1];
		}
		state.getCurrentContainer = getCurrentContainer;
		
		function getHeadingContainer() {
			return state.headingContainerStack[state.headingContainerStack.length-1];
		}
		state.getHeadingContainer = getHeadingContainer;
		
		function popState() {
			state.indentStack.pop();
			state.elementStack.pop();
		}
		state.popState = popState;

		function popHeadingState() {
			state.headingLevelStack.pop();
			state.headingContainerStack.pop();
	 		state.indentStack = [0];
			state.elementStack = [state.getHeadingContainer()];
		}
		state.popHeadingState = popHeadingState;


		function pushState(el) {
			state.indentStack.push(state.currentIndent);
			state.elementStack.push(el);
		}
		state.pushState = pushState;


		function pushHeadingState(el) {
			head = state.headingLevel
			
			state.headingLevelStack.push(head);
			
		
			state.getHeadingContainer().append(el);
			state.headingContainerStack.push(el);
			
			
			state.indentStack = [0];
			state.elementStack = [el];
		}
		state.pushHeadingState = pushHeadingState;

		
		return state;
}


	function loseWordMongrelMarkup(doc) {
			//Deal with MMDs        
			var startComment = /<\!--\[(.*?)\](--)?\>/g;
			//startCommentReplace = "<span title='start-$1'/><xml class='mso-conditional'>";
			
			var doc = doc.replace(startComment, "");
		
			var endComment = /<\!\[(.*?)\]--\>/g;
			//endCommentReplace = "</xml><span title='end-$1'/>";
			doc = doc.replace(endComment, "");

			//Ordinary conditional comment
			var comment = /<\!--\[(.*?)\]--\>/g;
			//commentReplace = "xxxxxxxxxxxx";
			doc = doc.replace(startComment, "");
		      
			var startMMD = /<\!\[(.*?)\]\>/g;
			//startMMDReplace = "<span title='$1'/>";
			doc = doc.replace(startMMD, "");


		
			var endMMD = /<\!\[endif\]>/g;
			//endMMDReplace = "<span title='endif'/>";
			doc = doc.replace(endMMD, "");

			//This is a rare special case, seems to be related to equations
			var wrapblock = /<o:wrapblock>/g;
			//wrapblockreplace = "<span title='wrapblock' ><!-- --></span>";
			doc = doc.replace(wrapblock, "");

			var endwrapblock = /<\/o:wrapblock>/g;
			//endwrapblockreplace = "<span title='end-wrapblock' ><!-- --></span>";
			doc = doc.replace(endwrapblock, "");

		    
			return doc;	

	}

	function getRidOfExplicitNumbering(element) {
		//Get rid of Word's redundant numbering (Note, don't don't do this on headings)
		jQ(element).find("span[style='mso-list:Ignore']").remove();
	
	}
	function getRidOfStyleAndClass(element) {
		jQ(element).removeAttr("style");
		jQ(element).removeAttr("class");
	}
   	function processparas() {
	  //TODO - recurse into tables

	  //Always wrap carefully
	  var container = jQ("<article></article>")	   
          processpara(jQ("body > *"), container);
          //Don't need a containing element for table cell contents
	  processpara(jQ("td > *"));
	  processpara(jQ("th > *"));
        }

   function processpara(nodeList, container) {
      var state = stateFactory(container);
      nodeList.each(
	    
	    function (index) {
		var type = "p";
                var tag = null;
		if (index == 0)  {
			jQ("body").prepend(state.getCurrentContainer());
                        
		}	
		//Table? Add it and get out
		if (jQ(this).get(0).nodeName === 'TABLE') {
			state.getCurrentContainer().append(jQ(this));
			return;
		}
		classs = String(jQ(this).attr("class")).toLowerCase();
		if (classs.search(/-itemprop-/) > -1) {
			jQ(this).attr("itemprop",classs.replace(/.*-itemprop-/, ""));
		}
		// Normalise some styles
	        var nodeName = jQ(this).get(0).nodeName;
                var isHeading = false;
		//Look for headings via paragraph style
		config.headingMatches.forEach(
			function (item) {
				if (classs.search(item[0]) > -1) {
					tag = classs.replace(item[0], item[1]);
					type = "h";
					headingLevel = item[2];
					
				}
			}
		);
  		
		if (nodeName.search(/H\d/) == 0) {
			headingLevel = parseFloat(nodeName.substring(1,2)) + 1; 
			type = "h";
		}

		if (type === 'h') {
			state.setHeadinglevel(headingLevel);
			state.headingLevelDown(); //unindent where necessary
			if (state.headingNestingNeeded()){
                              
				state.pushHeadingState(jQ("<section></section>"));
				
				
			}

		}
		
		else {
			state.setCurrentIndent(parseFloat(jQ(this).css("margin-left")));
		}

		
		
	
	      	//USe ICE style conventions to identify lists 
		if (classs.substr(0,2) == "li") {
			type = "li";
			listType = classs.substr(3,1);	
			if (listType == "n") {
				listType = "1";
			}
			else if (listType == "p") {
				type="p";
			}
		} 
	
	 	if (type == "p") {
			style = jQ(this).attr("style");
			//TODO This will fail on adjacent lists (or other things) with same depth but diff formatting
			if ( style && (style.search(/mso-list/) > -1)) {
			
				type = "li";
				//If this is a new list try to work out its type
				if (state.nestingNeeded()) {
					number = jQ(this).find("span[style='mso-list:Ignore']").text();
					if (number.search(/A/) > -1) {
						listType = "A";
					}
					else if (number.search(/a/) > -1) {
						listType = "a";
					}
					else if (number.search(/I/) > -1) {
						listType = "I";
					}
					else if (number.search(/i/) > -1) {
						listType = "i";
					}
					else {
						listType = "b"; //Default to bullet lists
					}
				}
			
			}
			else if (span = jQ(this).find("span:only-child")) {
				//We have some paragraph formatting
				fontFamily = span.css("font-family");
				//Word is not supplying the generic-family for stuff in Courier so sniff it out
				//TODO: add other monospaced fonts and put this in config
				
			
				if (fontFamily && (fontFamily.search(config.preMatch) > -1)) {
					type = "pre";
				}
			
			}

		}
		
		//Get rid of formatting now
		getRidOfStyleAndClass(jQ(this));

		

		state.levelDown(); //If we're embedded too far, fix that
	        //TODO fix nestingNeeded the check for 'h' is a hack
		if (!(type == "h") && state.nestingNeeded()) {
		
			//Put this inside the previous para element - we're going deeper
			jQ(this).appendTo(state.getCurrentContainer());
			if (type == "li") {
		                if (listType == "b") {
					jQ(this).wrap("<ul><li></li></ul>");
				}

				else {
				 	jQ(this).wrap("<ol type='" + listType + "'><li></li></ol>");
				}
				//TODO look at the number style and work out if we need to restart list numbering
				//The style info has a pointer to a list structure - if we see a new one restart the list

			
				getRidOfExplicitNumbering(jQ(this));
			
			
			}
			else if (type == "pre") {
				jQ(this).wrap("<pre></pre>");
				//TODO: fix unwanted line breaks
				jQ(this).replaceWith(jQ(this).text().replace(/\r/," "));
			}	
			else {
				 jQ(this).wrap("<blockquote></blockquote>");
				 
			}
			//All subsequent paras at the right level and type should go into this para
		        //So remember it
			
			state.pushState(jQ(this).parent());
		
		
		
		}
		else {
		      
		
			if (type == "li") {
				jQ(this).appendTo(state.getCurrentContainer().parent());
				jQ(this).wrap("<li></li>");

				getRidOfExplicitNumbering(jQ(this));
				state.pushState(jQ(this).parent());
			
			}
			else {

				jQ(this).appendTo(state.getCurrentContainer());
				if (type == "h") {
					
					if (tag) {
						//It's a heading - this replace with stuff doesn't seem to work if you do it before moving the element
						jQ(this).replaceWith( tag + jQ(this).html());

					} 
					
					
			
				}


				
				else if (type == "pre") {
					//TODO: Get rid of this repetition (but note you have to add jQ(this) to para b4 wrapping or it won't work)
					jQ(this).wrap("<pre></pre>");
					jQ(this).replaceWith(jQ(this).text());
				}
			}	
			
			}
		
		}
	      
	 
	  )
		}
        
    

  
    function h1(){     
	//TODO - split
	headingify("h1",jQ(this));
     }
    function h2(){     
	//TODO - split
	headingify("h2",jQ(this));
     }
    function h3(){     
	//TODO - split
	headingify("h3",jQ(this));
     }	
     function h4(){     
	//TODO - split
	headingify("h4",jQ(this));
     }
     function h5(){     
	//TODO - split
	headingify("h5",jQ(this));
     }	
   function headingify(tag,element){     
  
	host = jQ(getpara(element));
	splitStructure(host, tag);
	
	host.wrap("<x></x>".replace(/x/,tag));
      
	host.parent().html(host.html()	);
			
        makeEditable();
     }

    function paragraphify(){     
	//TODO - work out our heading level
	host = jQ(this).parents("h1,h2,h3,h4,h5");
	host.wrap("<p></p>");
	
	host.parent().html(host.html());
	makeEditable();
     }

    function getHeadingLevel(element){
	tag = element.get(0).nodeName;
	return parseFloat(tag.substring(1,2));
    }
    
    function getpara(element) {
	
	return element.parents("h1,h2,h3,h4,h5,p").first();	
    }

    function detachToolbar(){
	jQ(".toolbar").detach();
 	makeEditable();
    }

    function headingPromote(){     
	host = getpara(jQ(this));
	level = getHeadingLevel(host);
        
	if (level > 1) {
                host.wrap("<hx></hx>".replace(/x/,String(level-1)));
		
		host.parent().html(host.html());
		
	}
        makeEditable();
     }
     
     function toHtml(element) {
	return element.clone().wrap("<div></div>").parent().html();

     }
     function splitStructure(element) {
         
	//Make two copies of the parent and recurse until we hit the top level
        //alert(element.parent("article,body").html());
        //element = element.parent(); //Get me the LI
        //alert(element.get(0).nodeName + " < " + element.parent().get(0).nodeName);
	element.find(".toolbar").detach();
        if (element.parent().filter("article,body").length == 0) {
		
               if (element.next("ul,ol,blockquote").length	) {
			
		splitStructure(element.next());
		}	
		
	        var par = element.parent();
           
		var before = par.clone();
		
		before.empty();
		var after = before.clone();
		//Prev all in reverse doc order
		element.prevAll().each(function() {
			before.prepend(jQ(this));
		});
		

		after.append(element.nextAll());
		
		
		par.replaceWith(element);	
		if (before.children().length) {
			element.before(before);
		}
		if (after.children().length) {
			element.after(after);
		}
		
	
		splitStructure(element);
			
	 }
	
	 

	}
 

    function headingDemote(){     
	host = getpara(jQ(this));
	level = getHeadingLevel(host);
        
	if (level < 5) {
                host.wrap("<hx></hx>".replace(/x/,String(level+1)));
		host.parent().html(host.html());
		
	}
        makeEditable();
     }
      
   function toolbarFactory(toolbarClass) { 
	var toolbar = jQ("<span class='" + toolbarClass + "'></span>");
	 	function addButton(title, text) {
			
			
                        if (title) {
				button = jQ("<span class='button' id='" + title + "'> " + text + " </span>");
				
			} else {
				button = jQ("<span class='button'> " + text + " </span>");
			}
			toolbar.append(button);
			toolbar.find("#"+title).click(eval(title));
			
		};
   		
        	toolbar.addButton = addButton;
     		return toolbar;
	};
   function promote() {
        para = getpara(jQ(this));
        
	detachToolbar();
   }
  
 

   function populateToolbar() {
 	toolbar = toolbarFactory("toolbar");
	jQ(".toolbar").remove();
	
	jQ(this).prepend(toolbar);
	
	
	toolbar.addButton("paragraphify","P");
	toolbar.addButton("h1", "Heading 1");
	toolbar.addButton("h2", "Heading 2");
	toolbar.addButton("h3", "Heading 3");
	toolbar.addButton("h4", "Heading 4");
	toolbar.addButton("h5", "Heading 5");
	toolbar.addButton("more", "More options");
	toolbar.addButton("x", "[x] Close");
	
      

      // jQ("h1,h2,h3,h4,h5,p").hover( function () {jQ(this).prepend(headingLevelButtons);})


   }

   function more() {
	toolbar = toolbarFactory("more");
	jQ(".more").remove();	
	toolbar.addButton("zipall", "Zip");
	toolbar.addButton("getDocWithDataURIs", "Copy entire doc source");
	toolbar.addButton("getArticleWithDataURIs", "Copy as article");
	toolbar.addButton("getSectionWithDataURIs", "Copy as section");
	toolbar.addButton("clearToolbars", "[x] Close");
	jQ("body").prepend(toolbar);
   }


  function clearToolbars(){
	x(jQ("body"));
  }
  function x(node) {
        node.find("#copythis, .more, .toolbar, #source, #microdata").detach();
	
  }
   function getImageData(img) {
		src = img.attr("src");
		width = img.attr("width");
		height = img.attr("height");
		tempCanvas = jQ("<canvas></canvas>");
		tempCanvas.attr("height", height);
		tempCanvas.attr("width", width);
		drawingContext = tempCanvas.get(0).getContext("2d");
		
		drawingContext.drawImage(img.get(0),0,0);
		//jQ(this).after(tempCanvas);
		var format;
		if (src.search(/.png$/)) {
			format = "image/png";
		} else {
			format = "image/jpeg";
		}
		var data = tempCanvas.get(0).toDataURL(format);
		return  data;

   }


  function getSectionWithDataURIs() {
	getWithDataURIs(jQ("<section></section>").html(jQ("article").html()));
   }
  function getArticleWithDataURIs() {
	getWithDataURIs(jQ("article").clone());
   } 

   function getDocWithDataURIs() {
	getWithDataURIs(jQ("body").clone())
   }

  function getWithDataURIs(el) {
        elCopy = el.clone();
	
	x(elCopy);
	elCopy.find("img").each( function () { 
		data = getImageData(jQ(this));
		jQ(this).attr("src",data);
	})
	//alert(elCopy.html());
	return elCopy;

	}

   function zipall() {
	var zip = new JSZip();

	//TODO - 
	jQ(".toolbar").detach();
        fileName = document.location.href.replace(/.*\/(.*)$/, "$1");
	zip.add(fileName, jQ("html").html());
	//TODO - optionally add any other local files
        jQ("img").each( function () {
		data = getImageData(jQ(this));
		data = data.replace(/^data:image\/(png|jpg);base64,/, "");
		
		zip.add(src, data, {base64: true});
		tempCanvas = null;


	})
	//img = zip.folder("images");
	//img.add("smile.gif", imgData, {base64: true});
	content = zip.generate();
	location.href="data:application/zip;base64,"+content;
   }

    function seeData() {

	s = jQ("<span class='microdata'><span class='microdata-button'>{ }</span></span>");
	s.css({"position":"absolute","dispay" : "block", "left" : "40px", "background-color" : "white"});	
	s.find(".microdata-button").click(showMicrodata); //, unshowMicrodata);
	return s;
	}


  function seeSource(container) {
	var tag = container.get(0).nodeName;
	var s = jQ("<span class='source'><span class='sourcebutton'>&lt;" + tag  + "></span></span>");
	s.css({"position":"absolute","dispay" : "block", "left" : "60px", "background-color" : "white"});	
	
	s.find('.sourcebutton').click(showSource);
	return s;
	}

  function seeTopToolbar() {

	var s = jQ("<span id='toolbar'><span id='button-zip'>Download as zip</span> </span>");
	s.css({"position":"fixed", "dispay" : "block", "top" : "0px", "width" : "100%", "background-color" : "red", "color":"white"});	

	s.find("#button-zip").click(zipall);
	return s;
	}

 function unshowSource() {
	jQ(this).parent().replaceWith(seeSource(jQ(this).parents("section, article, html").first()));
	}

  function showSource() {
	 var el = jQ(this).parents("section, article, html").first();
         
	 jQ(this).parent().css({ "dispay" : "block", "background-color" : "gray", "width" : "50%", "height" : "50%"});
	 
  	 //el.find("#source").remove();
  	 var src = getWithDataURIs(el);
  	 viewer = jQ("<textarea></textarea>");
	 viewer.css({"background-color" : "white", "width" : "100%", "height" : "100%"});
	 src.wrap("<div></div>");
         viewer.html(src.parent().html())		;

         jQ(this).click(unshowSource);
   	 jQ(this).parent().append(viewer);
	 jQ(this).find("textarea").select();
	}

   function unshowMicrodata() {

	jQ(this).parent().replaceWith(seeData());
	}

   function showMicrodata() {
	 var el = jQ(this).parents("*[itemscope]").first();
	 jQ(this).parent().css({"background-color" : "gray", "width" : "50%", "height" : "50%"});
	
	
  	 
  	 var jsonText = jQ.microdata.json(el, function(o) { return JSON.stringify(o, undefined, 2); });
  	 var code = jQ("<textarea></textarea>");
	 code.html(jsonText);
         code.css({"background-color" : "white", "width" : "100%", "height" : "100%"});
   	 jQ(this).parent().append(code);
	 jQ(this).click(unshowMicrodata);
	 jQ(this).find("textarea").select();
	}


    function makeEditable() {
	
	
	//jQ("h1,h2,h3,h4,h5,p").click(populateToolbar);

        
	
	 jQ("section[itemscope], article[itemscope]").prepend(seeData());
	 jQ("table[itemscope] tr:first-child td:first-child").prepend(seeData());
	 jQ("tr[itemscope] td:first-child").prepend(seeData());

 	 jQ("body").prepend(seeTopToolbar());
	 jQ("section, article, body").each(function() {jQ(this).prepend(seeSource(jQ(this)))});
      
	
	  
	}


	
   function removeTableFormatting(el) {
        el.wrap("<div></div>");
	el2 = el.parent();
	el2.find("*[style]").removeAttr("style");
	//el2.find("*[border]").removeAttr("border");
	el2.find("*[cellspacing]").removeAttr("cellspacing");
	el2.find("*[cellpadding]").removeAttr("cellpadding");
	el2.find("*[width]").removeAttr("width");
	//el2.find("*[colspan]").removeAttr("colspan");
	el2.find("*[height]").removeAttr("height");
	el2.find("*[valign]").removeAttr("valign");
	el.unwrap();	
	el.removeAttr("class");
   }


  function removeMsoTableFormatting(el) {
        
        el.wrap("<div></div>");
	el2 = el.parent();
	el2.find("*[style]").each( function () {
		
                style = el.attr("style");
		
		style = style.replace(/mso-[\s\S]*(\;|$)?/g,"");
		
		el.attr("style",style);
                
	});
	
	el.unwrap();	
	el.removeAttr("class");
   }

   function convert() {
	//Start by string-processing MSO markup into something we can read and reloading
	if (jQ("article").length) {
		return ;
	}
	jQ("head").html(loseWordMongrelMarkup(jQ("head").html()));

	jQ("body").html(loseWordMongrelMarkup(jQ("body").html()));

	// TODO alert(loseWordMongrelMarkup("<![if !supportLists]>"));

	//Get rid of the worst of the emndded stuff
	jQ("xml").remove();
	//Get rid of Word's sections
	jQ("div").each(
	function(index) {
	   jQ(this).children(":first-child").unwrap();
	}
	
	);
	

	


	processparas();

	//Add Schema.org markup

	jQ("table[summary^='itemprop']").each(function() {
		prop = jQ(this).attr("summary");
		prop = prop.replace(/itemprop-/,"");
		jQ(this).attr("itemprop", prop);
		jQ(this).removeAttr("summary");
	});
	
	//Wordprocessor microformat - needs work.
	jQ("a[href^='http://schema.org/']").each(function() {
		var href = jQ(this).attr("href");
		container = jQ(this).parents("tr:not(:first-child),table,section,article,body").first();
		//Use spit on '?' instead?
		
		typeProp = href.split("?itemprop=");
		container.attr("itemtype", typeProp[0]);
		if (typeProp.length == 2) {
			jQ(container).attr("itemprop", typeProp[1]);
		}
		
		container.attr("itemscope", "itemscope");
		jQ(this).replaceWith(jQ(this).html());
		
	});


        jQ("*[class^='itemprop-']").each(function() {
		prop = jQ(this).attr("class");
		prop = prop.replace(/itemprop-/,"");
		inHeading = jQ(this)	.parent("h1,h2,h3,h4,h5");
		if  (inHeading.length) {
			//Itemprop on a heading means it applies 
			container.get(0).attr("itemprop", prop);
			jQ(this).find("*:first").unwrap();
		}

		else {
			container = jQ(this);

		}
		container.attr("itemprop", prop);
		container.removeAttr("class");
	});
	
	//Clean it all up
	//jQ("span[style] *:first-child").unwrap();

        
	jQ("span[mso-spacerun='yes']").remove(); //.replacewith(" ");
	jQ("o\\:p, p:empty, span:empty,style, link, meta,xml").remove();
	
	jQ("span[style]:first-child").unwrap();
        
	
	
	jQ("v:shapetype").remove();
	jQ("span[class='SpellE']").each(function(i) {$(this).replaceWith($(this).html()	)});
	jQ("span[class='GramE']").each(function(i) {$(this).replaceWith($(this).html()	)});
	html = jQ("html");
 	html.removeAttr("xmlns");
	html.removeAttr("xmlns:v");
	html.removeAttr("xmlns:o");
	html.removeAttr("xmlns:w");
	html.removeAttr("xmlns:m");
        body = html.find("body");
	body.removeAttr("link");
	body.removeAttr("vlink");

	//Clean up tables
	jQ("table").each( function() {
		summary = jQ(this).attr("summary");
		if (summary && jQ(this).attr("summary").replace(/^noformat/, "") != summary) {
			removeTableFormatting(jQ(this));
		} else {
			removeMsoTableFormatting(jQ(this));
		}
	});
	//TODO make this configurable
	jQ("span[lang^='EN']").each(function(i) {$(this).replaceWith($(this).html()	)});
        makeEditable();

	 
   }
   word2html.convert = convert;
   word2html.config = config;
  
   if (typeof chrome === 'undefined' ||  typeof chrome.extension === 'undefined')  {
	logoURL = "http://tools.scholarlyhtml.org/w2html5/w2html5ext/logo-Xalon-ext.png";
	}
   else {
		logoURL = chrome.extension.getURL('logo-Xalon-ext.png');
			
		
   }	
   jQ("body").css("background-image", "url(" + logoURL + ")");
   jQ("body").css("background-repeat", "no-repeat");
  
   

   
   return word2html;

}







