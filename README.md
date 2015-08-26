# ViSC - Visibility State Controller JS

## Why?
> Have you ever found yourself in the need of knowing how much of an element is visible to, let's say, animate some of it styles depending on the percentage? Well, there you go!

## How To Use

#### Details
- 'Selector' can be a **node**, an **array of nodes**, a **NodeList** or a **jQuery object**.
- The events callback and the **'getState'** methods return an array list of the **VisibilityState Object**.

#### Vanilla JS
````
var selector = ".element";

// Creates a new ViSController
var visc = new Visc();

// Binds the scroll and resize events with a callback
// attached to the elements queried by the selector.
visc.bind(selector, function(states) {});

// Unbind all ViSC events related to the selector
visc.unbind();

// Gets the visibility state of a selector without
// binding scroll and resize events. 
var states = Visc.getState(selector);
````

#### jQuery / Zepto
````
var selector = ".element";

// Binds the scroll and resize events with a callback.
$(selector).visc(function(states){});

// Unbind all ViSC events related to the selector
$(selector).unvisc();

// Gets the visibility state of a selector without
// binding scroll and resize events. 
var states = $(selector).visc('getState');
````

### Visibility State Object
````
VisibilityState
{
	// How much of the element is visible?
	visibilityRate: { 
		both: Percentage, 
		horizontal: Percentage,
		vertical: Percentage
	},
	// How much space does the element occupies in the viewport?
	occupiedViewport: { 
		both: Percentage, 
		horizontal: Percentage,
		vertical: Percentage
	},
	// How much of the element you can see in your viewport?
	maxVisibility = { 
		both: Percentage, 
		horizontal: Percentage,
		vertical: Percentage
	},
	// Current Element
	element: Node;
}
````
### Static Methods
````
// Gets the visibility state of a selector without
// binding scroll and resize events. 
Visc.getState(selector);

// Gets the number of ViSC instances 
Visc.getNumberOfInstances();
````

## Compatibility 
- IE 9+
- jQuery & Zepto Compatible
