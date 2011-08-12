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
			
	config.headingMatch = /H(ead)?(ing)? ?(\d).*/i;
        config.headingReplace = "h$3";



	function stateFactory(toppara) {


		 //Make the assumption Normal has zero indent
		  //TODO work out zero indent from Normal style (and deal with negative indents?)
		var state = {};
		state.indentStack = [0];
	 	state.elementStack = [toppara];
		state.currentIndent = 0;
		function setCurrentIndent(indent) {
			state.currentIndent = indent;
		}
		state.setCurrentIndent = setCurrentIndent;
		function nestingNeeded() {
			//Test whether current left=margin indent means we should add some nesting
			return(state.currentIndent > state.indentStack[state.indentStack.length-1]);
		
		}
		state.nestingNeeded = nestingNeeded;
		function levelDown() {
			while (state.currentIndent < state.indentStack[state.indentStack.length-1]) {
				popState();
			}
			
		}
		state.levelDown = levelDown;
		function getCurrentElement() {
			return state.elementStack[state.elementStack.length-1];
		}
		state.getCurrentElement = getCurrentElement;
		function popState() {
			state.indentStack.pop();
			state.elementStack.pop();
		}
		state.popState = popState;
		function pushState(el) {
			state.indentStack.push(state.currentIndent);
			state.elementStack.push(el);
		}
		state.pushState = pushState;
		function resetState() {
			state.indentStack = [0];
			state.elementStack = [state.elementStack[0]];
		}
		state.resetState = resetState;
		return state;
}


	function loseWordMongrelMarkup(doc) {
			//Deal with MMDs        
			startComment = /<\!--\[(.*?)\]\>/g;
			startCommentReplace = "<span title='start-jQ1'/><xml class='mso-conditional'>";
			doc = doc.replace(startComment, startCommentReplace);
		
			endComment = /<\!\[(.*?)\]--\>/g;
			endCommentReplace = "</xml><span title='end-jQ1'/>";
			doc = doc.replace(endComment, endCommentReplace);

			//Ordinary conditional comment
			comment = /<\!--\[(.*?)\]--\>/g;
			commentReplace = "";
			doc = doc.replace(startComment, commentReplace);
		      
			startMMD = /<\!\[(.*?)\]\>/g;
			startMMDReplace = "<span title='jQ1'/>";
			doc = doc.replace(startMMD, startMMDReplace);


		
			endMMD = /<\!\[endif\]>/g;
			endMMDReplace = "<span title='endif'/>";
			doc = doc.replace(endMMD, endMMDReplace);

			//This is a rare special case, seems to be related to equations
			wrapblock = /<o:wrapblock>/g;
			wrapblockreplace = "<span title='wrapblock' ><!-- --></span>";
			doc = doc.replace(wrapblock, wrapblockreplace);

			endwrapblock = /<\/o:wrapblock>/g;
			endwrapblockreplace = "<span title='end-wrapblock' ><!-- --></span>";
			doc = doc.replace(endwrapblock, endwrapblockreplace);

		    
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

	  //para for our page
	  para = jQ("<article></article>")	   
          processpara(jQ("body > *"), para);
          //Don't need a containing element for table cell contents
	  processpara(jQ("td > *"));
	  processpara(jQ("th > *"));
        }

   function processpara(nodeList, para) {
      state = stateFactory(para);
      nodeList.each(
	    
	    function (index) {
		var type = "p";
		if (index == 0)  {
			jQ("body").prepend(state.getCurrentElement());
                        
		}
		classs = String(jQ(this).attr("class")).toLowerCase();
		// Normalise some styles
	        nodeName = jQ(this).get(0).nodeName;
                isHeading = false;
		//Look for headings via paragraph style
  		if (classs.search(config.headingMatch) > -1) {
			tag = classs.replace(config.headingMatch, config.headingReplace);
			type = "h";
		}
		

                if (nodeName.search(/H\d/) == 0) {
			state.resetState();
			type = "h";
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
	
		if (state.nestingNeeded()) {
		
			//Put this inside the previous para element - we're going deeper
			jQ(this).appendTo(state.getCurrentElement());
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
			//TODO - wrap this in a proper state object rather than the parallel arrays: FRAGILE!
			state.pushState(jQ(this).parent());
		
		
		
		}
		else {
		
		
			if (type == "li") {
				jQ(this).appendTo(state.getCurrentElement().parent());
				jQ(this).wrap("<li></li>");
				getRidOfExplicitNumbering(jQ(this));
			
			}
			else {

				jQ(this).appendTo(state.getCurrentElement())		;
				if (type == "h") {
					//It's a heading - this replace with stuff doesn't seem to work if you do it before moving the element
					jQ(this).replaceWith("<" + tag + ">" + jQ(this).html() + "</" + tag + ">");

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
        
    

  

	
   function headingify(){     
	//TODO - work out our heading level
 
	host = jQ(this).parents("p");
	host.wrap("<h1></h1>");
	
	host.parent().html(host.html());
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
	parent = element.parents("h1,h2,h3,h4,h5,p");
	return parent;

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

    function headingDemote(){     
	host = getpara(jQ(this));
	level = getHeadingLevel(host);
        
	if (level < 5) {
                host.wrap("<hx></hx>".replace(/x/,String(level+1)));
		host.parent().html(host.html());
		
	}
        makeEditable();
     }
      
   function toolbarFactory() { 
	var toolbar = jQ("<div class='toolbar'></div>");
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
   function demote() { //DEPRECATED (like, really)
        para = getpara(jQ(this));
	paraName = para.get(0).nodeName;
	//There might be a classier algorithm but for now handle list items
	//differently
        if (para.parent("li").length) {
          
	     if (para.prev("p").length) {
			//Not first  so we can indent it
			para.wrap("<li></li>");
			if (para.parent().parent("ul").length) {
				para.wrap("<ul></ul>");

			}
			else {
				para.wrap("<ol></ol>");
			}
		}
	     else { //first paragraph
			if(para.parent().prev("li").length) {

				//Does the previous sibling contain a list?
				prevSiblingList = para.parent().prev("li").find("ul:last-child,ol:last-child");
				if (prevSiblingList.length) {
					prevSiblingList.filter(":last").append(para.parent());
				}
				else if (para.parent().next("ul,ol").length) {
					para.next().prepend(para.parent());
				}
				else if (para.parent().parent().parent("ul").length) {
					para.parent().wrap("<ul></ul>");

				}
				else {
					para.parent().wrap("<ol></ol>");
				}
			}

			else {
				alert("You can't demote this - turn it into a plan paragraph first"); 
			}
		}
	}
	else { //Just a <p>
	  
		//Is there something we can embed this in?
		if (para.prev("ul,ol").length){         
		     para.prev().find("li").filter(":last").append(para);
		}
		else if (para.prev("blockquote").length){
		     para.prev().find("li").filter(":last").append(para);
		}
		else if (!para.parent("blockquote").length) {
			para.wrap("<blockquote></blockquote>");
			//TODO: Merge adjacent elements
		}
		else {
			alert("Indenting not allowed");
		}
	}
		


	detachToolbar();
   }
 

   function populateToolbar() {
 	toolbar = toolbarFactory();
	jQ(".toolbar").remove();
	
	jQ(this).prepend(toolbar);
	if (jQ(this).filter("h1").length) {

		toolbar.addButton("paragraphify","P");
		toolbar.addButton(null, "<-");
		toolbar.addButton("headingDemote","->");
	} else if (jQ(this).filter("h2,h3,h4").length) {
		toolbar.addButton("paragraphify","P");
		toolbar.addButton("headingPromote", "<-");
		toolbar.addButton("headingDemote","->");
	} else if (jQ(this).filter("h5").length) {
		toolbar.addButton("paragraphify","P");
		toolbar.addButton("headingPromote", "<-");
		toolbar.addButton(null,"->");
	}
	else {
		toolbar.addButton("headingify", "h");
		
	}
      

      // jQ("h1,h2,h3,h4,h5,p").hover( function () {jQ(this).prepend(headingLevelButtons);})


   }
   function makeEditable() {
	
	
	jQ("h1,h2,h3,h4,h5,p").click(populateToolbar);


	
        //TODO - be more selective
	
	
	}

   function convert() {
	//Start by string-processing MSO markup into something we can read and reloading
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
	)


	processparas();
	
	//Clean it all up
	jQ("p:empty").remove();
	jQ("span:empty").remove();
        
	jQ("span[mso-spacerun='yes']").remove(); //.replacewith(" ");
	jQ("o\:p").remove();
	jQ("style").remove();
	jQ("xml").remove();
	jQ("v:shapetype").remove();
	jQ("span[class='SpellE']").each(function(i) {$(this).replaceWith($(this).html()	)});
	jQ("span[class='GramE']").each(function(i) {$(this).replaceWith($(this).html()	)});

	//TODO make this configurable
	jQ("span[lang^='EN']").each(function(i) {$(this).replaceWith($(this).html()	)});
        makeEditable();
   }
   word2html.convert = convert;
   word2html.config = config;
   return word2html;

}







