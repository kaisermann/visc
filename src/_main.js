(function (window, $, undefined) {
  'use strict';

  let
    _win = {},
    _client = {},
    _instanced = 0;

  /* Private Window Methods */
  const updateWindowSize = function () {
    _client = {
      top: document.documentElement.clientTop,
      left: document.documentElement.clientLeft
    };
    _win = new Frame(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
      window.innerWidth, window.innerHeight);
  };

  const getBooleanStatement = function (booleanMode, collection, callback) {
    let returnVal = (booleanMode === Visc.BooleanMode.AND);
    for (let i = 0; i < collection.length; i++) {
      if (booleanMode === Visc.BooleanMode.AND) {
        returnVal &= callback(collection[i]);
      } else {
        returnVal |= callback(collection[i]);
      }
    }
    return !!returnVal;
  };

  const isFrameOnScreen = function (frame) {
    return !!_win.intersectionWith(frame);
  };

  const getNodes = function (unknownObj) {
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
  class Frame {
    constructor(x, y, w, h) {
      this.left = Math.round(x);
      this.top = Math.round(y);
      this.width = Math.round(w);
      this.height = Math.round(h);
      this.right = this.left + this.width;
      this.bottom = this.top + this.height;
    }
    get area() {
      return this.width * this.height;
    }

    subtractFrom(rect) {
      return new Frame(this.left - rect.left, this.top - rect.top, this.width, this.height);
    }

    intersectionWith(rect) {
      const
        top = Math.max(this.top, rect.top),
        left = Math.max(this.left, rect.left),
        right = Math.min(this.right, rect.right),
        bottom = Math.min(this.bottom, rect.bottom);

      const
        width = right - left,
        height = bottom - top;

      return (width >= 0 && height >= 0) ? new Frame(left, top, width, height) : null;
    }

    static getOffsetRect(node) {
      const box = node.getBoundingClientRect();
      const top = box.top + _win.top - _client.top;
      const left = box.left + _win.left - _client.left;

      return new Frame(left, top, box.width, box.height);
    }
  }
  /* -- Frame Class -- */

  /* -- Private Helper Methods -- */
  const windowChanged = function () {
    if (typeof this.callback === 'function') {
      this.callback.call(this, this.getState(this.nodes));
    }
  };
  /* -- Private Helper Methods -- */

  /* -- Visibility State Controller Class -- */
  class Visc {
    constructor() {
      const _self = this;

      this.nodes = [];
      this.binded = false;
      this.callback = null;
    }

    /* -- Public Methods -- */
    bind(node, callback) {
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
    }

    unbind() {
      this.binded = false;
      window.removeEventListener('resize', windowChanged.bind(this));
      window.removeEventListener('scroll', windowChanged.bind(this));

      if (!(--_instanced)) {
        window.removeEventListener('resize', updateWindowSize);
        window.removeEventListener('scroll', updateWindowSize);
      }

      return this;
    }

    getState(nodes) {
      if (!nodes) {
        return null;
      }

      if (!this.nodes.length) {
        this.nodes = getNodes(nodes);
      }

      if (!_instanced) {
        updateWindowSize();
      }

      const states = [];

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i],
          nodeFrame = Frame.getOffsetRect(node),
          nodeIntersection = nodeFrame.intersectionWith(_win),
          nodeFrameArea = nodeFrame.area;

        const state = {
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
          const nodeIntersectionArea = nodeIntersection.area;
          const minWidth = Math.min(nodeFrame.width, _win.width);
          const minHeight = Math.min(nodeFrame.height, _win.height);

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
    }

    /* -- Public Static Methods -- */
    static get numberOfInstances() {
      return _instanced;
    }

    static getState(nodeOrCollection) {
      return new Visc().getState(nodeOrCollection);
    }

    static isVisible(nodeOrCollection, min = 0, booleanMode = Visc.BooleanMode.AND) {
      return getBooleanStatement(
        booleanMode,
        Visc.getState(nodeOrCollection),
        state => {
          const rate = state.maxVisibility.both;
          return (rate > 0 && rate >= min) || rate === 1;
        }
      );
    }

    static isOnScreen(nodeOrCollection, booleanMode = Visc.BooleanMode.AND) {
        updateWindowSize();
        return getBooleanStatement(
          booleanMode,
          getNodes(nodeOrCollection),
          node => isFrameOnScreen(Frame.getOffsetRect(node))
        );
      }
      /* -- Public Static Methods -- */
  }

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
        const vsc = new Visc();
        this.data('visc', vsc);
        vsc.bind(this, arguments[0]);
        return this;
      } else {
        $.error(`Method "${method}" does not exist on $.ViSC`);
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
