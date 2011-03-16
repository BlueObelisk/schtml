var jQ = jQuery;


jQ(document).ready(function() {
    


        jmolInitialize(jmolPath, true);
    
        var scml, url;
        scml = jQ("span[rel=http://www.xml-cml.org/convention/crystallographyExperiment]");
       
        scml.each(function(c, i){ i=jQ(i); 
     
            var div = jQ("<div/>");
            url = i.attr("resource");
           
            i.append(div);
            div.jmol({
                "img": jmolPath + "/cml.png",
                "url":url,
                "script":"load $ {1 1 1}"
            });
            _gUrl=url;
        });
      
 
});
