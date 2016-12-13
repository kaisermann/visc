(function (window, $, undefined) {
  'use strict';

  var
    _win = {},
    _client = {},
    _instanced = 0;

  /* Private Window Methods */
  var updateWindowSize = function () {
    _client = {
      top: document.documentElement.clientTop,
      left: document.documentElement.clientLeft
    };
    _win = new Frame(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
      window.innerWidth, window.innerHeight);
  };

  var getBooleanStatement = function (booleanMode, collection, callback) {
    var returnVal = (booleanMode === Visc.BooleanMode.AND);
    for (var i = 0; i < collection.length; i++) {
      if (booleanMode === Visc.BooleanMode.AND) {
        returnVal &= callback(collection[i]);
      } else {
        returnVal |= callback(collection[i]);
      }
    }
    return !!returnVal;
  };

  var isFrameOnScreen = function (frame) {
    return !!_win.intersectionWith(frame);
  };

  var getNodes = function (unknownObj) {
    if (typeof unknownObj === 'string') {
      return document.querySelectorAll(unknownObj);
    }

    if (!!window.jQuery && unknownObj instanceof jQuery) {
      return jQuery.makeArray(unknownObj);
    }

    if (unknownObj.length !== undefined && typeof unknownObj !== 'function') {
      return unknownObj;
    }

    if (unknownObj.nodeType) {
      return [unknownObj];
    }

    return null;
  };
  /* -- Private Window Methods -- */

  /* -- Frame Class -- */
  var Frame = function Frame(x, y, w, h) {
    this.left = Math.round(x);
    this.top = Math.round(y);
    this.width = Math.round(w);
    this.height = Math.round(h);
    this.right = this.left + this.width;
    this.bottom = this.top + this.height;
  };

  var prototypeAccessors = { area: {} };
  prototypeAccessors.area.get = function () {
    return this.width * this.height;
  };

  Frame.prototype.subtractFrom = function subtractFrom (rect) {
    return new Frame(this.left - rect.left, this.top - rect.top, this.width, this.height);
  };

  Frame.prototype.intersectionWith = function intersectionWith (rect) {
    var
      top = Math.max(this.top, rect.top),
      left = Math.max(this.left, rect.left),
      right = Math.min(this.right, rect.right),
      bottom = Math.min(this.bottom, rect.bottom);

    var
      width = right - left,
      height = bottom - top;

    return (width >= 0 && height >= 0) ? new Frame(left, top, width, height) : null;
  };

  Frame.getOffsetRect = function getOffsetRect (node) {
    var box = node.getBoundingClientRect();
    var top = box.top + _win.top - _client.top;
    var left = box.left + _win.left - _client.left;

    return new Frame(left, top, box.width, box.height);
  };

  Object.defineProperties( Frame.prototype, prototypeAccessors );
  /* -- Frame Class -- */

  /* -- Private Helper Methods -- */
  var windowChanged = function () {
    if (typeof this.callback === 'function') {
      this.callback.call(this, this.getState(this.nodes));
    }
  };
  /* -- Private Helper Methods -- */

  /* -- Visibility State Controller Class -- */
  var Visc = function Visc() {
    var _self = this;

    this.nodes = [];
    this.binded = false;
    this.callback = null;
  };

  var staticAccessors = { numberOfInstances: {} };

  /* -- Public Methods -- */
  Visc.prototype.bind = function bind (node, callback) {
    if (!(_instanced++)) {
      window.addEventListener('resize', updateWindowSize);
      window.addEventListener('scroll', updateWindowSize);
    }

    if (typeof callback !== 'function') {
      throw ('[Visc: Invalid Callback]');
    }

    this.callback = callback;

    this.nodes = getNodes(node);
    this.binded = true;

    window.addEventListener('resize', windowChanged.bind(this));
    window.addEventListener('scroll', windowChanged.bind(this));

    return this;
  };

  Visc.prototype.unbind = function unbind () {
    this.binded = false;
    window.removeEventListener('resize', windowChanged.bind(this));
    window.removeEventListener('scroll', windowChanged.bind(this));

    if (!(--_instanced)) {
      window.removeEventListener('resize', updateWindowSize);
      window.removeEventListener('scroll', updateWindowSize);
    }

    return this;
  };

  Visc.prototype.getState = function getState (nodes) {
      var this$1 = this;

    if (!nodes) {
      return null;
    }

    if (!this.nodes.length) {
      this.nodes = getNodes(nodes);
    }

    if (!_instanced) {
      updateWindowSize();
    }

    var states = [];

    for (var i = 0; i < this.nodes.length; i++) {
      var node = this$1.nodes[i],
        nodeFrame = Frame.getOffsetRect(node),
        nodeIntersection = nodeFrame.intersectionWith(_win),
        nodeFrameArea = nodeFrame.area;

      var state = {
        node: node,
        onScreen: isFrameOnScreen(nodeFrame),
        visibilityRate: {
          both: 0,
          horizontal: 0,
          vertical: 0
        },
        occupiedViewport: {
          both: 0,
          horizontal: 0,
          vertical: 0
        },
        maxVisibility: {
          both: 0,
          horizontal: 0,
          vertical: 0
        },
        frames: {
          window: new Frame(0, 0, 0, 0),
          viewport: new Frame(0, 0, 0, 0),
          node: new Frame(0, 0, 0, 0)
        }
      };

      if (nodeIntersection && nodeFrame.width !== 0 && nodeFrame.height !== 0) {
        var nodeIntersectionArea = nodeIntersection.area;
        var minWidth = Math.min(nodeFrame.width, _win.width);
        var minHeight = Math.min(nodeFrame.height, _win.height);

        state.frames = {
          window: nodeIntersection,
          viewport: nodeIntersection.subtractFrom(_win),
          node: nodeIntersection.subtractFrom(nodeFrame)
        };

        state.visibilityRate = {
          both: nodeIntersectionArea / nodeFrameArea,
          horizontal: nodeIntersection.width /  nodeFrame.width,
          vertical: nodeIntersection.height /  nodeFrame.height
        };

        state.occupiedViewport = {
          both: nodeIntersectionArea / _win.area,
          horizontal: nodeIntersection.width /  _win.width,
          vertical: nodeIntersection.height /  _win.height
        };

        state.maxVisibility = {
          both: nodeIntersectionArea / (minWidth * minHeight),
          horizontal: nodeIntersection.width /  minWidth,
          vertical: nodeIntersection.height /  minHeight
        };
      }
      states.push(state);
    }
    return states;
  };

  /* -- Public Static Methods -- */
  staticAccessors.numberOfInstances.get = function () {
    return _instanced;
  };

  Visc.getState = function getState (nodeOrCollection) {
    return new Visc().getState(nodeOrCollection);
  };

  Visc.isVisible = function isVisible (nodeOrCollection, min, booleanMode) {
      if ( min === void 0 ) min = 0;
      if ( booleanMode === void 0 ) booleanMode = Visc.BooleanMode.AND;

    return getBooleanStatement(
      booleanMode,
      Visc.getState(nodeOrCollection),
      function (state) {
        var rate = state.maxVisibility.both;
        return (rate > 0 && rate >= min) || rate === 1;
      }
    );
  };

  Visc.isOnScreen = function isOnScreen (nodeOrCollection, booleanMode) {
        if ( booleanMode === void 0 ) booleanMode = Visc.BooleanMode.AND;

      updateWindowSize();
      return getBooleanStatement(
        booleanMode,
        getNodes(nodeOrCollection),
        function (node) { return isFrameOnScreen(Frame.getOffsetRect(node)); }
      );
    };

  Object.defineProperties( Visc, staticAccessors );

  /* -- Public Static BooleanMode Enum -- */
  Visc.BooleanMode = {
    AND: 0,
    OR: 1
  };
  /* -- Public BooleanMode Enum -- */

  /* -- jQuery / Zepto Plugin -- */
  if ($) {
    $.fn.visc = function (method) {
      if (method === 'getState')
        return Visc.getState(this);

      if (typeof method === 'function') {
        var vsc = new Visc();
        this.data('visc', vsc);
        vsc.bind(this, arguments[0]);
        return this;
      } else {
        $.error(("Method \"" + method + "\" does not exist on $.ViSC"));
      }
    };

    $.fn.unvisc = function () {
      this.data('visc').unbind();
      return this;
    };
  }
  /* -- jQuery / Zepto Plugin -- */

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visc;
  } else {
    window.Visc = Visc;
  }
})(window, window.jQuery || window.Zepto || window.$);
