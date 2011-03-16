
(function( $ ){

    $.fn.jmol = function( args ) {

        var settings = {
            'img'         : '',
            'url'         : '',
            'size'        : '400',
            'text'        : 'Click to activate Jmol',
            'script'      : 'load $'
        };

        this.extend( settings, args );

        this.append( "<div class='jmol-container'>"
                        +  "<div class='jmol-image'>"
                       
                        +    "[" + settings.text + "]"
                        +  "</div>"
                        +"</div>"
                );

        $( ".jmol-container", this )
                .width( settings.size )
                .height( settings.size );

        $( "div.jmol-container", this ).click( function(e) {

            // Stop Jmol from over-writing current document
            var tmp = _jmol.currentDocument;
            jmolSetDocument( null );

            // Generate Jmol html
            var script = settings.script.replace( '$', settings.url );
            var jmolInstanceHtml = jmolApplet( settings.size, script );

            // Restore Jmol document
            jmolSetDocument( tmp );

            // Load jmol
            $(this).html(
                    "<div class='jmol-applet'>"
                            + jmolInstanceHtml
                            + "</div>"
                    );
        });

        return this;

    };

})( jQuery );

