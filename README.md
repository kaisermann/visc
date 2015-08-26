# ViSC - Visibility State Controller JS

## Compatibility 
- IE 9+
- jQuery & Zepto Compatible

## How To Use
###Vanilla JS
> var visc = new Visc();
> visc.bind(element_list, function(states) {});
> visc.unbind();
> Visc.getState(element_list);

###jQuery / Zepto Methods
> $('selector').visc(function(states){})
> $('selector').visc('getState');
> $('selector').unvisc();