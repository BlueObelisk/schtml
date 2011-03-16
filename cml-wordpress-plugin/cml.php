<?php
/*
Plugin Name: CML
Plugin URI: http://scholarlyhtml.org/tools/WordPress/CML
Description: This is a wordpress server plugin to do something useful when it finds chemisty embedded in a link
Author: Peter Sefton
Author URI: http://ptsefton.com
*/


define("CML_VERSION", '0.1a');
define("CML_COMMUNITY", 'CML.me');
define("CML_COMMUNITY_HOSTNAME", 'CML.me');



function CML_wp_print_scripts(){
 global $post, $user_login, $user_identity, $user_email, $user_ID, $current_user, $user_url;
		if(is_single())
		{

			
			$plugin_name = str_replace("/", "", str_replace(basename( __FILE__),"",plugin_basename(__FILE__))); 
			$plugin_url = WP_PLUGIN_URL .'/' . $plugin_name . '/';
			$js_path = $plugin_url. 'js/'; 
			
			
			wp_enqueue_script('jquery');          
			wp_enqueue_script('jmol',$js_path.'jmol/Jmol.js'); 
			wp_enqueue_script('jquery.jmol',$js_path.'jmol/jquery.jmol.js'); 
            wp_enqueue_script('cml',$js_path.'cml.js'); 
			
	    
			$js = "<script> var jmolPath = '".$js_path."jmol/';</script> ";
			echo $js; 
		
	}
}

function CML_ContentFilter($content)
	{
       
		return $content;
	 }
  



add_action('wp_print_scripts', 'CML_wp_print_scripts');
add_filter('the_content', 'CML_ContentFilter');



?>
