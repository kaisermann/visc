/*
 * ViSC - Visibility State Controller JS v1.3.0
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
 	getBooleanStatement = function(collection, callback, iteratorMode)
 	{
 		var _cacheANDMode = Visc.BooleanIteratorMode.AND;
 		iteratorMode = iteratorMode || Visc.BooleanIteratorMode.AND;

 		var returnValue = (iteratorMode === _cacheANDMode)?true:false;
 		for(var i = 0, len = collection.length; i < len; i++)
 		{
 			if(iteratorMode === _cacheANDMode)
 				returnValue &= callback(collection[i]);
 			else
 				returnValue |= callback(collection[i]);
 		}
 		return !!returnValue;
 	},
 	isCollection = function(o) { return o.length!==undefined; },
 	isFrameOnScreen = function(frame) { return !!_win.intersectionWith(frame); },
 	getNodes = function(unknownObj)
 	{
 		if(typeof unknownObj === "string")
 			return document.querySelectorAll(unknownObj);

 		if(!!window.jQuery  && unknownObj instanceof jQuery)
 			return jQuery.makeArray(unknownObj);

 		if(isCollection(unknownObj))
 			return unknownObj;
 		
 		if(unknownObj.nodeType)
 			return [unknownObj];

 		return null;
 	};
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
 		var __self = this,
 		__elements = [],
 		__binded = false,
 		__callback;

 		/* -- Private Helper Methods -- */
 		var
 		windowChanged = function()
 		{
 			if(!!__callback)
 				__callback.call(__self,__self.getState(__elements));
 		};
 		/* -- Private Helper Methods -- */

 		/* -- Privilleged Methods -- */
 		__self.bind = function(element, callback)
 		{
 			if(!(_instanced++))
 				bindWindowObserver();

 			if(typeof callback === 'function')
 				__callback = callback;
 			else
 				console.error("[Visc: Invalid Callback]");
 			__elements = getNodes(element);

 			__binded = true;
 			window.addEventListener("resize", windowChanged);
 			window.addEventListener("scroll", windowChanged);
 		};

 		__self.unbind = function () 
 		{
 			__self.__elements = [];

 			__binded = false; 
 			window.removeEventListener("resize", windowChanged);
 			window.removeEventListener("scroll", windowChanged);

 			if(!(--_instanced)) 
 				unbindWindowObserver(); 
 		};

 		__self.getState = function(elements) 
 		{
 			if(elements === undefined)
 				return null;

 			if(!__elements.length)
 				__elements = getNodes(elements);

 			if(!__binded)
 				updateWindowSize();

 			var _states = []; 		

 			for(var i = 0; i < __elements.length; i++)
 			{
 				var _e = __elements[i],
 				_frame = getOffsetRect(_e),
 				_intersection = _frame.intersectionWith(_win),
 				_frameArea = _frame.getArea();

 				var _state = new VisibilityState(_e);

 				if(_intersection && _frame.width!==0 && _frame.height!==0)
 				{
 					var 
 					_intersectionArea = _intersection.getArea(),
 					_minWidth = Math.min(_frame.width, _win.width),
 					_minHeight = Math.min(_frame.height, _win.height);

 					_state.frames = { 
 						window: _intersection,
 						viewport: _intersection.subtractFrom(_win),
 						element: _intersection.subtractFrom(_frame)
 					};

 					_state.visibilityRate = {
 						both: _intersectionArea / _frameArea,
 						horizontal: _intersection.width / _frame.width,
 						vertical: _intersection.height / _frame.height
 					};

 					_state.occupiedViewport = {
 						both: _intersectionArea / _win.getArea(),
 						horizontal: _intersection.width / _win.width,
 						vertical: _intersection.height / _win.height
 					};

 					_state.maxVisibility =
 					{
 						both: _intersectionArea / (_minWidth * _minHeight),
 						horizontal: _intersection.width / _minWidth,
 						vertical: _intersection.height / _minHeight	
 					};

 				}
 				_state.onScreen = isFrameOnScreen(_frame);
 				_states.push(_state);
 			}
 			return _states;	
 		};
 		/* -- Privilleged Methods -- */

 		updateWindowSize();
 	};

 	/* -- Public BooleanIterator Enum -- */
 	Visc.BooleanIteratorMode = {AND:0,OR:1};
 	/* -- Public BooleanIterator Enum -- */

 	/* -- Public Static Methods -- */
 	Visc.getNumberOfInstances = function () { return _instanced; };
 	Visc.getState = function (elements) { return new Visc().getState(elements); };
 	Visc.isVisible = function (nodeOrCollection, min, booleanIteratorMode) 
 	{ 
 		if(!booleanIteratorMode || !min)
 			min = 0;

 		return getBooleanStatement(Visc.getState(getNodes(nodeOrCollection)), function(state)
 		{
 			var rate = state.maxVisibility.both;
 			return (rate > 0 && rate >= min) || rate == 1;
 		}, booleanIteratorMode);
 	};
 	Visc.isOnScreen = function (nodeOrCollection, booleanIteratorMode) 
 	{ 
 		updateWindowSize();
 		return getBooleanStatement(getNodes(nodeOrCollection), function(element)
 		{
 			return isFrameOnScreen(getOffsetRect(element));
 		}, booleanIteratorMode);
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
 				return Visc.getState(this);
 			
 			if (typeof method === 'function') 
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
