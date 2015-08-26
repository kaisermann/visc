/*!
 * ViSC - Visibility State Controller JS v0.5
 * Elements Visibility State Controller
 * https://github.com/chriskaisermann/ViSC
 * by Christian Kaisermann
 */

 /* global jQuery */
 /* global Zepto */

 (function(window, $, undefined)
 {
 	'use strict';

 	var
 	_Slice = Array.prototype.slice,
 	_win = {},
 	_client = {},
 	_instanced = 0;

 	/* Private Window Methods */
 	var 
 	bindWindowObserver = function() 
 	{ 
 		window.addEventListener("resize", updateWindowSize);
 		window.addEventListener("scroll", updateWindowSize);
 	},
 	unbindWindowObserver =function () 
 	{
 		window.removeEventListener("resize", updateWindowSize);
 		window.removeEventListener("scroll", updateWindowSize);
 	},
 	updateWindowSize = function()
 	{
 		_client = { top: document.documentElement.clientTop, left: document.documentElement.clientLeft };
 		_win = new Rectangle(
 			window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
 			window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop, 
 			window.innerWidth, window.innerHeight);
 	};
 	/* -- Private Window Methods -- */

 	/* -- Rectangle Class -- */
 	function Rectangle(x, y, w, h)
 	{
 		this.left = Math.round(x);
 		this.top = Math.round(y);
 		this.width = Math.round(w);
 		this.height = Math.round(h);
 		this.right = this.left + this.width;
 		this.bottom = this.top + this.height;
 	}

 	Rectangle.prototype.getArea = function() { return this.width * this.height; };
 	Rectangle.prototype.intersectionWith = function(rect)
 	{
 		var 
 		top = Math.max(this.top, rect.top),
 		left = Math.max(this.left, rect.left),
 		right = Math.min(this.right, rect.right),
 		bottom = Math.min(this.bottom, rect.bottom);

 		var
 		width = right - left,
 		height = bottom - top;

 		return (width >= 0 && height >= 0)?new Rectangle(left, top, width, height):null;
 	};
 	/* -- Rectangle Class -- */

 	/* -- Visibility State Controller Class -- */

 	var Visc = function() 
 	{
 		var _self = this,
 		__elements = [],
 		__binded = false,
 		__callback;

 		/* -- Private Helper Methods -- */
 		var 
 		getOffsetRect = function(element) 
 		{
 			var box = element.getBoundingClientRect();
 			var top = box.top + _win.top - _client.top;
 			var left = box.left + _win.left - _client.left;

 			return new Rectangle(left, top, box.width, box.height);
 		},
 		getElements = function(elements)
 		{
 			var _eType = elements.constructor.name || null;
 			__elements = [];
 			if(typeof elements === "string")
 				__elements = _Slice.call(document.querySelectorAll(elements), 0);
 			if(!!window.jQuery  && elements instanceof jQuery)
 				__elements = jQuery.makeArray(elements);
 			else if(_eType==="NodeList")
 				__elements = _Slice.call(elements, 0);
 			else if(Array.isArray(elements))
 				__elements = elements;
 			else if(elements.nodeType)
 				__elements.push(elements);
 			else
 				return null;
 		},
 		windowChanged = function()
 		{
 			if(!!__callback)
 				__callback.call(_self,_self.getState(__elements));
 		};
 		/* -- Private Helper Methods -- */

 		/* -- Privilleged Methods -- */
 		_self.bind = function(element, callback)
 		{
 			if(!_instanced++)
 				bindWindowObserver();

 			if(typeof callback === 'function')
 				__callback = callback;
 			else
 				console.error("[Visc: Invalid Callback]");
 			getElements(element);

 			__binded = true;
 			window.addEventListener("resize", windowChanged);
 			window.addEventListener("scroll", windowChanged);
 		};

 		_self.unbind = function () 
 		{
 			_self.__elements = [];

 			__binded = false; 
 			window.removeEventListener("resize", windowChanged);
 			window.removeEventListener("scroll", windowChanged);

 			if(!--_instanced) 
 				unbindWindowObserver(); 
 		}

 		_self.getState = function(elements) 
 		{
 			if(elements === undefined)
 				return null;

 			if(!__elements.length)
 				getElements(elements);

 			if(!__binded)
 				updateWindowSize();

 			var states = []; 		

 			for(var i = 0; i < __elements.length; i++)
 			{
 				var _e = __elements[i],
 				_frame = getOffsetRect(_e),
 				_intersection = _frame.intersectionWith(_win);

 				var state = new VisibilityState(_e);

 				if(_intersection)
 				{
 					var 
 					_intersectionArea = _intersection.getArea(),
 					_minWidth = Math.min(_frame.width, _win.width),
 					_minHeight = Math.min(_frame.height, _win.height);

 					state.visibilityRate = {
 						both: _intersectionArea / _frame.getArea(),
 						horizontal: _intersection.width / _frame.width,
 						vertical: _intersection.height / _frame.height
 					};

 					state.occupiedViewport = {
 						both: _intersectionArea / _win.getArea(),
 						horizontal: _intersection.width / _win.width,
 						vertical: _intersection.height / _win.height
 					};

 					state.maxVisibility =
 					{
 						both: _intersectionArea / (_minWidth * _minHeight),
 						horizontal: _intersection.width / _minWidth,
 						vertical: _intersection.height / _minHeight	
 					};

 				}
 				states.push(state);
 			}
 			return states;	
 		};
 		/* -- Privilleged Methods -- */

 		updateWindowSize();
 	};


 	/* -- Public Static Methods -- */
 	Visc.getNumberOfInstances = function () { return _instanced; };
 	Visc.getState = function (elements) { return new Visc().getState(elements); }
 	/* -- Public Static Methods -- */
 	/* -- Visibility State Controller Class -- */

 	/* -- Visibility State Class -- */
 	function VisibilityState (element)
 	{
 		this.visibilityRate = {both:0,horizontal:0,vertical:0};
 		this.occupiedViewport = {both:0,horizontal:0,vertical:0};
 		this.maxVisibility = {both:0,horizontal:0,vertical:0};
 		this.element = element;
 	}
 	/* -- Visibility State Class -- */

 	/* -- jQuery / Zepto Plugin -- */
 	if(!!$)
 	{
 		$.fn['visc'] = function (method) 
 		{
 			if(method==="getState")
 			{
 				return Visc[method].call(this, this);
 			}
 			else if (typeof method === 'function' || !method) 
 			{
 				var vsc = new Visc();
 				this.data('visc', vsc);
 				vsc.bind(this, arguments[0]);
 				return this;
 			}
 			else 
 				$.error( 'Method "' +  method + '"" does not exist on $.ViSC' );
 		};

 		$.fn['unvisc'] = function () { return this.data('visc').unbind(); }
 	}
 	/* -- jQuery / Zepto Plugin -- */

 	window.Visc = Visc;
 })(window, window.jQuery || window.Zepto || window.$);
