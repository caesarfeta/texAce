/*!
 * texAce - texAce
 * http://adamtavares.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
;(function(jQuery) {
	
	/**
	 * Holds default options, adds user defined options, and initializes the plugin
	 *
	 * @param { obj } _elem The DOM element where the plugin will be drawn
	 *
	 * @param { obj } _options Key value pairs to hold the plugin's configuration
	 *
	 * @param { string } _id The id of the DOM element
	 */
	function texAce( _elem, _options, _id ) {
		var self = this;
		self.elem = _elem;
		self.id = _id;
		self.init( _elem, _options );
	}
	
	/**
	 * Holds default options, adds user defined options, and initializes the plugin
	 *
	 * @param { obj } _elem The DOM element where the plugin will be drawn
	 *
	 * @param { obj } _options Key value pairs to hold the plugin's configuration
	 */
	texAce.prototype.init = function( _elem, _options ) {
		var self = this;
		
		//------------------------------------------------------------
		// Mark your territory
		//------------------------------------------------------------
		jQuery( self.elem ).addClass('texAce')
		
		//------------------------------------------------------------
		// User options 
		//------------------------------------------------------------
		self.options = jQuery.extend({
			theme: 'tomorrow',
			lang: 'javascript',
			theme_selector: false
		}, _options );
		
		//------------------------------------------------------------
		// User events
		//------------------------------------------------------------
		self.events = {
			change: 'TEXACE-CHANGE'
		}
		
		//------------------------------------------------------------
		// Themes
		//------------------------------------------------------------
		self.themes = [
			'ambiance', 'chaos', 'chrome', 
			'clouds', 'clouds_midnight', 'cobalt',
			'crimson_editor', 'dawn', 'dreamweaver',
			'eclipse', 'github', 'idle_fingers',
			'katzenmilch', 'kr', 'kuroir', 
			'merbivore', 'merbivore_soft', 'mono_industrial',
			'monokai', 'pastel_on_dark', 'solarized_dark',
			'solarized_light', 'terminal', 'textmate',
			'tomorrow', 'tomorrow_night', 'tomorrow_night_blue',
			'tomorrow_night_bright', 'tomorrow_night_eighties', 'twilight',
			'vibrant_ink', 'xcode'
		];
		
		//------------------------------------------------------------
		// Check cookie for persistent options
		//------------------------------------------------------------
		self.cookieCheck( _options );
		
		//------------------------------------------------------------
		// Build the DOM
		//------------------------------------------------------------
		jQuery( self.elem ).wrap( '<div class="texAce"></div>' );
		self.elem = jQuery( self.elem ).parent();
		
		//------------------------------------------------------------
		// Mark your territory
		//------------------------------------------------------------
		self.elem.addClass('texAce');
		
		//------------------------------------------------------------
		// Get textarea XML
		//------------------------------------------------------------
		self.textarea = jQuery( 'textarea', self.elem );
		var xml = self.textarea.val();
		self.textarea.hide();
		jQuery( self.elem ).append( '<div id="aceMask"><div id="aceWrapper"><div id="aceEditor"></div></div></div>' );
		jQuery( '#aceEditor', self.elem ).text( xml );
	
		//------------------------------------------------------------
		// Startup and configure ace editor.
		//------------------------------------------------------------
		self.aceEditor = ace.edit( "aceEditor" );
		self.aceEditor.getSession().setUseWrapMode( true );
		self.theme();
		self.lang();
		
		//------------------------------------------------------------
		//  Build the theme selector
		//------------------------------------------------------------
		self.buildSelector();
		
		//------------------------------------------------------------
		// Window resize listener.
		//------------------------------------------------------------
		jQuery( window ).on( 'resize', function() { self.resize() } );
		
		//------------------------------------------------------------
		// Ace editor events requiring an update.
		// Working around the limitations of the Ace callback system.
		//------------------------------------------------------------
		self.aceEditor.on( "blur", function() { self.update( self.aceEditor.getValue() ) } );
		self.aceEditor.on( "change", function() { self.update( self.aceEditor.getValue() ) } );
		self.aceEditor.on( "changeSelectionStyle", function() { self.update( self.aceEditor.getValue() ) } );
		self.aceEditor.on( "changeSession", function() { self.update( self.aceEditor.getValue() ) } );
		self.aceEditor.on( "copy", function() { self.update( self.aceEditor.getValue() ) } );
		self.aceEditor.on( "focus", function() { self.update( self.aceEditor.getValue() ) } );
		self.aceEditor.on( "paste", function() { self.update( self.aceEditor.getValue() ) } );
		
		//------------------------------------------------------------
		// Changes are a two-way street.
		//------------------------------------------------------------
		self.updateReverse();
		
		//------------------------------------------------------------
		// Initial sizing.
		//------------------------------------------------------------
		self.resize();
	}

	/**
	 * Builds a theme selector
	 */	
	texAce.prototype.buildSelector = function() {
		var self = this;
		
		//------------------------------------------------------------
		// Build the theme selector
		//------------------------------------------------------------
		var selector = '';
		if ( self.options['theme_selector'] ) {
			selector += '<select id="themeSelector">';
			for ( var i=0, ii=self.themes.length; i<ii; i++ ) {
				mark = '';
				//------------------------------------------------------------
				// Mark the current theme
				//------------------------------------------------------------
				if ( self.themes[i] == self.options['theme'] ) {
					mark = 'selected';
				}
				selector += '<option value="'+ self.themes[i] +'" '+mark+'>' + self.themes[i] +'</option>';
			}
			selector += '</select><div style="clear:both"></div>';
		}
		jQuery( self.elem ).prepend( selector );
		
		//------------------------------------------------------------
		// Theme selection event
		//------------------------------------------------------------
		jQuery( "#themeSelector", self.elem ).change( function( _e ) {
			jQuery( 'option:selected', this ).each( function() {
				var theme = jQuery( this ).val();
				self.theme( theme );
			});
		});
	}
	
	/**
	 * Resize the Ace editor
	 * Not sure how expensive timewise this is.
	 */
	texAce.prototype.resize = function() {
		var height = 0;
		jQuery( "#aceEditor .ace_gutter-cell" ).each( function(){
			height += jQuery(this).outerHeight();
		});
		jQuery( "#aceMask", this.elem ).height( height );
	}
	
	/**
	 * Checks which default options aren't being overwritten.
	 * Those options could be stored as cookies.
	 * This checks for the existence of those cookie values.
	 * If they exist then they'll overwrite the defaults.
	 */		
	texAce.prototype.cookieCheck = function( _options ) {
		var self = this;
		var check = [];
		//------------------------------------------------------------
		//  Find which default options aren't
		//------------------------------------------------------------
		for ( var opt in self.options ) {
			if ( opt in _options ) {
				continue;
			}
			check.push( opt );
		}
		for ( var i=0, ii=check.length; i<ii; i++ ) {
			var cookieVal = jQuery.cookie( 'texAce:'+check[i] );
			if ( cookieVal != undefined ) {
				self.options[ check ] = cookieVal;
			}
		}
	}
	
	/**
	 * Set a cookie for persistent texAce options
	 */	
	texAce.prototype.cookieSet = function( _key, _val ) {
		jQuery.cookie( _key, _val, { path: '/' } );
	}
	
	/**
	 * Change the Ace editor language
	 */
	texAce.prototype.lang = function( _lang ) {
		var self = this;
		_lang = ( _lang == undefined ) ? self.options['lang'] : _lang;
		self.aceEditor.getSession().setMode( "ace/mode/" + _lang );
		
	}
	
	/**
	 * Change the Ace editor theme
	 */
	texAce.prototype.theme = function( _theme ) {
		var self = this;
		_theme = ( _theme == undefined ) ? self.options['theme'] : _theme;
		self.aceEditor.setTheme( "ace/theme/" + _theme );
		self.cookieSet( 'texAce:theme', _theme );
	}
	
	/**
	 * Holds default options, adds user defined options, and initializes the plugin
	 *
	 * @param { string } _text The text to copy to the source textarea
	 */
	texAce.prototype.update = function( _text ) {
		var self = this;
		self.textarea.val( _text );
		//------------------------------------------------------------
		// Ace's events sometimes get triggered before the editor's
		// appearance changes. This delay hopefully is sufficient
		// to fix this problem without the user noticing.
		//------------------------------------------------------------
		setTimeout( function(){
			self.resize();
		}, 50 );
	}

	/**
	 * Update in reverse... textarea to Ace Editor
	 */	
	texAce.prototype.updateReverse = function() {
		var self = this;
		var text = self.textarea.val();
		setInterval ( function() {
			var check = self.textarea.val();
			var editorCheck = self.aceEditor.getValue();
			if ( text != check && check != editorCheck ) {
				text = check;
				self.aceEditor.getSession().setValue( text );
				self.resize();
			}
		}, 500 );
	}
	
	//----------------
	// Extend JQuery 
	//----------------
	jQuery(document).ready( function(jQuery) {
		jQuery.fn.texAce = function( options ) {
			var id = jQuery(this).selector;
			return this.each( function() {
				jQuery.data( this, id, new texAce( this, options, id ) );
			});
		};
	})
})(jQuery);
