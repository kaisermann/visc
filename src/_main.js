/*
 * ViSC - Visibility State Controller JS v1.2.0
 * Elements Visibility State Controller
 * https://github.com/chriskaisermann/ViSC
 * by Christian Kaisermann
 */

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
 	unbindWindowObserver = function () 
 	{
 		window.removeEventListener("resize", updateWindowSize);
 		window.removeEventListener("scroll", updateWindowSize);
 	},
 	updateWindowSize = function()
 	{
 		_client = { top: document.documentElement.clientTop, left: document.documentElement.clientLeft };
 		_win = new Frame(
 			window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
 			window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop, 
 			window.innerWidth, window.innerHeight);
 	},
 	getOffsetRect = function(element) 
 	{
 		var box = element.getBoundingClientRect();
 		var top = box.top + _win.top - _client.top;
 		var left = box.left + _win.left - _client.left;

 		return new Frame(left, top, box.width, box.height);
 	},
 	booleanIterator = function(nodeOrCollection, callback)
 	{
 		if(isCollection(nodeOrCollection))
 		{
 			var returnValue = true;
 			for(var i = 0, len = nodeOrCollection.length; i < len; i++)
 				returnValue &= callback(nodeOrCollection[i]);
 			return !!returnValue;
 		}
 		return callback(nodeOrCollection);
 	},
 	isCollection = function(o) { return o.length!==undefined; };
 	/* -- Private Window Methods -- */

 	/* -- Frame Class -- */
 	function Frame(x, y, w, h)
 	{
 		this.left = Math.round(x);
 		this.top = Math.round(y);
 		this.width = Math.round(w);
 		this.height = Math.round(h);
 		this.right = this.left + this.width;
 		this.bottom = this.top + this.height;
 	}
 	Frame.prototype.getArea = function() { return this.width * this.height; };
 	Frame.prototype.subtractFrom = function (r) 
 	{
 		return new Frame(this.left - r.left, this.top - r.top, this.width, this.height);
 	};
 	Frame.prototype.intersectionWith = function(r)
 	{
 		var 
 		top = Math.max(this.top, r.top),
 		left = Math.max(this.left, r.left),
 		right = Math.min(this.right, r.right),
 		bottom = Math.min(this.bottom, r.bottom);

 		var
 		width = right - left,
 		height = bottom - top;

 		return (width >= 0 && height >= 0) ? new Frame(left, top, width, height) : null;
 	};
 	/* -- Frame Class -- */

 	/* -- Visibility State Controller Class -- */

 	var Visc = function() 
 	{
 		var _self = this,
 		__elements = [],
 		__binded = false,
 		__callback;

 		/* -- Private Helper Methods -- */
 		var
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
 			if(!(_instanced++))
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

 			if(!(--_instanced)) 
 				unbindWindowObserver(); 
 		};

 		_self.isOnScreen = function(frame)
 		{
 			return frame.left<=_win.right && frame.right >= _win.left && frame.top <= _win.bottom && frame.bottom >= _win.top;
 		};

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
 				_intersection = _frame.intersectionWith(_win),
 				_frameArea = _frame.getArea();

 				var state = new VisibilityState(_e);

 				if(_intersection && _frame.width!==0 && _frame.height!==0)
 				{
 					var 
 					_intersectionArea = _intersection.getArea(),
 					_minWidth = Math.min(_frame.width, _win.width),
 					_minHeight = Math.min(_frame.height, _win.height);

 					state.frames = { 
 						window: _intersection,
 						viewport: _intersection.subtractFrom(_win),
 						element: _intersection.subtractFrom(_frame)
 					};

 					state.visibilityRate = {
 						both: _intersectionArea / _frameArea,
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
 				state.onScreen = _self.isOnScreen(_frame);
 				states.push(state);
 			}
 			return states;	
 		};
 		/* -- Privilleged Methods -- */

 		updateWindowSize();
 	};


 	/* -- Public Static Methods -- */
 	Visc.getNumberOfInstances = function () { return _instanced; };
 	Visc.getState = function (elements) { return new Visc().getState(elements); };
 	Visc.isVisible = function (nodeOrCollection, min) 
 	{ 
 		min = min || 0.000; 
 		return booleanIterator(Visc.getState(nodeOrCollection), function(state)
 		{
 			var rate = state.visibilityRate.both;
 			return rate > 0 && rate >= min;
 		});
 	};
 	Visc.isOnScreen = function (nodeOrCollection) 
 	{ 
 		return booleanIterator(nodeOrCollection, function(element)
 		{
 			return new Visc().isOnScreen(getOffsetRect(element));
 		});
 	};
 	/* -- Public Static Methods -- */

 	/* -- Visibility State Controller Class -- */

 	/* -- Visibility State Class -- */
 	function VisibilityState (element)
 	{
 		this.visibilityRate = {both:0,horizontal:0,vertical:0};
 		this.occupiedViewport = {both:0,horizontal:0,vertical:0};
 		this.maxVisibility = {both:0,horizontal:0,vertical:0};
 		this.element = element;
 		this.onScreen = false;
 		this.frames = {window: new Frame(0,0,0,0), viewport: new Frame(0,0,0,0), element: new Frame(0,0,0,0)};
 	}
 	/* -- Visibility State Class -- */

 	/* -- jQuery / Zepto Plugin -- */
 	if(!!$)
 	{
 		$.fn.visc = function (method) 
 		{
 			if(method==="getState")
 			{
 				return Visc.getState(this);
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

 		$.fn.unvisc = function () { return this.data('visc').unbind(); };
 	}
 	/* -- jQuery / Zepto Plugin -- */

 	window.Visc = Visc;
 })(window, window.jQuery || window.Zepto || window.$);
