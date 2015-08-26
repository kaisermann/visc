/*!
 * Visibility Js v0.1
 * Elements visibility state
 * by Christian Kaisermann
 */

 window.visibility = function(element)
 {
 	'use strict';

 	var
 	_eType = element.constructor.name || null,
 	elements = [],
 	_win,
 	_clientTop = document.documentElement.clientTop,
 	_clientLeft = document.documentElement.clientLeft;

 	function p(s) { console.log(s); }

 	function Visibility()
 	{
 		setup();

 		if(!!window.jQuery  && element instanceof jQuery)
 		{
 			elements = jQuery.makeArray(element);
 			p(elements);
 		}
 		else if(_eType==="NodeList")
 			elements = Array.prototype.slice.call(element, 0);
 		else if(Array.isArray(element))
 			elements = element;
 		else if(element.nodeType)
 			elements.push(element);
 		else
 			return null;

 		var states = [];

 		for(var i = 0; i < elements.length; i++)
 		{
 			var _e = elements[i];
 			var _frame = getOffsetRect(_e);
 			var _intersection = _frame.intersectionWith(_win);

 			var state = new VisibilityState();

 			if(_intersection)
 			{
 				var 
 				_intersectionArea = _intersection.area(),
 				_minWidth = Math.min(_frame.width, _win.width),
 				_minHeight = Math.min(_frame.height, _win.height);

 				state.visibilityRate = {
	 				both: _intersectionArea / _frame.area(),
	 				horizontal: _intersection.width / _frame.width,
	 				vertical: _intersection.height / _frame.height
 				}

 				state.occupiedViewport = {
	 				both: _intersectionArea / _win.area(),
	 				horizontal: _intersection.width / _win.width,
	 				vertical: _intersection.height / _win.height
 				}

 				state.maxVisibility =
 				{
	 				both: _intersectionArea / (_minWidth * _minHeight),
	 				horizontal: _intersection.width / _minWidth,
	 				vertical: _intersection.height / _minHeight	
 				}

 			}
 			if(elements.length==1)
 				return state;
 			states.push(state);
 		}
 		return states;
 	}

 	function VisibilityState ()
 	{
 		this.visibilityRate = {both:0,horizontal:0,vertical:0};
 		this.occupiedViewport = {both:0,horizontal:0,vertical:0};
 		this.maxVisibility = {both:0,horizontal:0,vertical:0};
 	}

 	function setup()
 	{
 		_win = new Rectangle(
 			window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
 			window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
 			window.innerWidth,
 			window.innerHeight);
 	}

 	function getOffsetRect(element) 
 	{
 		var box = element.getBoundingClientRect();
 		var top = box.top + _win.top - _clientTop;
 		var left = box.left + _win.left - _clientLeft;

 		return new Rectangle(left, top, box.width, box.height);
 	}

 	function Rectangle(x, y, w, h)
 	{
 		this.left = Math.round(x);
 		this.top = Math.round(y);
 		this.width = Math.round(w);
 		this.height = Math.round(h);
 		this.right = this.left + this.width;
 		this.bottom = this.top + this.height;
 	}

 	/* -- Rectangle Class -- */

 	Rectangle.prototype.area = function() { return this.width * this.height; };
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

 		return (width >= 0 && height >= 0) ? new Rectangle(left, top, width, height) : null;
 	}
 	/* -- Rectangle Class -- */


 	return new Visibility();
 };
