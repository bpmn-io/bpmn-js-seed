/*!
 * bpmn-js - bpmn-modeler v0.8.0

 * Copyright 2014, 2015 camunda Services GmbH and other contributors
 *
 * Released under the bpmn.io license
 * http://bpmn.io/license
 *
 * Source Code: https://github.com/bpmn-io/bpmn-js
 *
 * Date: 2015-01-22
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.BpmnJS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var BpmnModdle = _dereq_(35),
    IdSupport = _dereq_(37),
    Ids = _dereq_(161);

var Viewer = _dereq_(2);

var initialDiagram =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                    'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
                    'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
                    'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
                    'targetNamespace="http://bpmn.io/schema/bpmn" ' +
                    'id="Definitions_1">' +
    '<bpmn:process id="Process_1" isExecutable="false">' +
      '<bpmn:startEvent id="StartEvent_1"/>' +
    '</bpmn:process>' +
    '<bpmndi:BPMNDiagram id="BPMNDiagram_1">' +
      '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">' +
        '<bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">' +
          '<dc:Bounds height="36.0" width="36.0" x="173.0" y="102.0"/>' +
        '</bpmndi:BPMNShape>' +
      '</bpmndi:BPMNPlane>' +
    '</bpmndi:BPMNDiagram>' +
  '</bpmn:definitions>';

/**
 * A modeler for BPMN 2.0 diagrams.
 *
 * @class
 *
 * @inheritDoc djs.Viewer
 */
function Modeler(options) {
  Viewer.call(this, options);
}

Modeler.prototype = Object.create(Viewer.prototype);

Modeler.prototype.createDiagram = function(done) {
  return this.importXML(initialDiagram, done);
};

Modeler.prototype.createModdle = function() {
  var moddle = new BpmnModdle();

  IdSupport.extend(moddle, new Ids([ 32, 36, 1 ]));

  return moddle;
};


Modeler.prototype._interactionModules = [
  // non-modeling components
  _dereq_(12),
  _dereq_(147),
  _dereq_(144),
  _dereq_(145)
];

Modeler.prototype._modelingModules = [
  // modeling components
  _dereq_(93),
  _dereq_(135),
  _dereq_(117),
  _dereq_(79),
  _dereq_(126),
  _dereq_(95),
  _dereq_(23),
  _dereq_(8),
  _dereq_(27)
];


// modules the modeler is composed of
//
// - viewer modules
// - interaction modules
// - modeling modules

Modeler.prototype._modules = [].concat(
  Modeler.prototype._modules,
  Modeler.prototype._interactionModules,
  Modeler.prototype._modelingModules);


module.exports = Modeler;

},{}],2:[function(_dereq_,module,exports){
'use strict';

var Diagram = _dereq_(60),
    BpmnModdle = _dereq_(35),
    $ = (window.$),
    _ = (window._);

var Importer = _dereq_(30);


function initListeners(diagram, listeners) {
  var events = diagram.get('eventBus');

  listeners.forEach(function(l) {
    events.on(l.event, l.handler);
  });
}

function checkValidationError(err) {

  // check if we can help the user by indicating wrong BPMN 2.0 xml
  // (in case he or the exporting tool did not get that right)

  var pattern = /unparsable content <([^>]+)> detected([\s\S]*)$/;
  var match = pattern.exec(err.message);

  if (match) {
    err.message =
      'unparsable content <' + match[1] + '> detected; ' +
      'this may indicate an invalid BPMN 2.0 diagram file' + match[2];
  }

  return err;
}

var DEFAULT_OPTIONS = {
  width: '100%',
  height: '100%',
  position: 'relative'
};

/**
 * A viewer for BPMN 2.0 diagrams.
 *
 * Includes the basic viewing functionality.
 *
 * Have a look at {@link NavigatedViewer} or {@link Modeler} for bundles that include
 * additional features.
 *
 * @param {Object} [options] configuration options to pass to the viewer
 * @param {DOMElement} [options.container] the container to render the viewer in, defaults to body.
 * @param {String|Number} [options.width] the width of the viewer
 * @param {String|Number} [options.height] the height of the viewer
 * @param {Array<didi.Module>} [options.modules] a list of modules to override the default modules
 * @param {Array<didi.Module>} [options.additionalModules] a list of modules to use with the default modules
 */
function Viewer(options) {

  this.options = options = _.extend({}, DEFAULT_OPTIONS, options || {});

  var parent = options.container || $('body');

  var container = $('<div class="bjs-container"></div>').appendTo(parent);

  container.css({
    width: options.width,
    height: options.height,
    position: options.position
  });

  // unwrap jquery
  this.container = container.get(0);


  /**
   * The code in the <project-logo></project-logo> area
   * must not be changed, see http://bpmn.io/license for more information
   *
   * <project-logo>
   */

  /* jshint -W101 */

  // inlined ../resources/bpmnjs.png
  var logoData = 'iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAMAAADypuvZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADBQTFRFiMte9PrwldFwfcZPqtqN0+zEyOe1XLgjvuKncsJAZ70y6fXh3vDT////UrQV////G2zN+AAAABB0Uk5T////////////////////AOAjXRkAAAHDSURBVHjavJZJkoUgDEBJmAX8979tM8u3E6x20VlYJfFFMoL4vBDxATxZcakIOJTWSmxvKWVIkJ8jHvlRv1F2LFrVISCZI+tCtQx+XfewgVTfyY3plPiQEAzI3zWy+kR6NBhFBYeBuscJLOUuA2WVLpCjVIaFzrNQZArxAZKUQm6gsj37L9Cb7dnIBUKxENaaMJQqMpDXvSL+ktxdGRm2IsKgJGGPg7atwUG5CcFUEuSv+CwQqizTrvDTNXdMU2bMiDWZd8d7QIySWVRsb2vBBioxOFt4OinPBapL+neAb5KL5IJ8szOza2/DYoipUCx+CjO0Bpsv0V6mktNZ+k8rlABlWG0FrOpKYVo8DT3dBeLEjUBAj7moDogVii7nSS9QzZnFcOVBp1g2PyBQ3Vr5aIapN91VJy33HTJLC1iX2FY6F8gRdaAeIEfVONgtFCzZTmoLEdOjBDfsIOA6128gw3eu1shAajdZNAORxuQDJN5A5PbEG6gNIu24QJD5iNyRMZIr6bsHbCtCU/OaOaSvgkUyDMdDa1BXGf5HJ1To+/Ym6mCKT02Y+/Sa126ZKyd3jxhzpc1r8zVL6YM1Qy/kR4ABAFJ6iQUnivhAAAAAAElFTkSuQmCC';

  /* jshint +W101 */

  var a = $('<a href="http://bpmn.io" target="_blank" class="bjs-powered-by" title="Powered by bpmn.io" />').css({
    position: 'absolute',
    bottom: 15,
    right: 15,
    zIndex: 100
  });

  var logo = $('<img/>').attr('src', 'data:image/png;base64,' + logoData).appendTo(a);

  a.appendTo(container);

  /* </project-logo> */
}

Viewer.prototype.importXML = function(xml, done) {

  var self = this;

  this.moddle = this.createModdle();

  this.moddle.fromXML(xml, 'bpmn:Definitions', function(err, definitions) {

    if (err) {
      err = checkValidationError(err);
      return done(err);
    }

    self.importDefinitions(definitions, done);
  });
};

Viewer.prototype.saveXML = function(options, done) {

  if (!done) {
    done = options;
    options = {};
  }

  var definitions = this.definitions;

  if (!definitions) {
    return done(new Error('no definitions loaded'));
  }

  this.moddle.toXML(definitions, options, done);
};

Viewer.prototype.createModdle = function() {
  return new BpmnModdle();
};

Viewer.prototype.saveSVG = function(options, done) {

  if (!done) {
    done = options;
    options = {};
  }

  var canvas = this.get('canvas');

  var contentNode = canvas.getDefaultLayer(),
      defsNode = canvas._svg.select('defs');

  var contents = contentNode.innerSVG(),
      defs = (defsNode && defsNode.outerSVG()) || '';

  var bbox = contentNode.getBBox();

  var svg =
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- created with bpmn-js / http://bpmn.io -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
         'width="' + bbox.width + '" height="' + bbox.height + '" ' +
         'viewBox="' + bbox.x + ' ' + bbox.y + ' ' + bbox.width + ' ' + bbox.height + '" version="1.1">' +
      defs + contents +
    '</svg>';

  done(null, svg);
};

Viewer.prototype.get = function(name) {

  if (!this.diagram) {
    throw new Error('no diagram loaded');
  }

  return this.diagram.get(name);
};

Viewer.prototype.invoke = function(fn) {

  if (!this.diagram) {
    throw new Error('no diagram loaded');
  }

  return this.diagram.invoke(fn);
};

Viewer.prototype.importDefinitions = function(definitions, done) {

  // use try/catch to not swallow synchronous exceptions
  // that may be raised during model parsing
  try {
    if (this.diagram) {
      this.clear();
    }

    this.definitions = definitions;

    var diagram = this.diagram = this._createDiagram(this.options);

    this._init(diagram);

    Importer.importBpmnDiagram(diagram, definitions, done);
  } catch (e) {
    done(e);
  }
};

Viewer.prototype._init = function(diagram) {
  initListeners(diagram, this.__listeners || []);
};

Viewer.prototype._createDiagram = function(options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);

  // add self as an available service
  modules.unshift({
    bpmnjs: [ 'value', this ],
    moddle: [ 'value', this.moddle ]
  });

  options = _.omit(options, 'additionalModules');

  options = _.extend(options, {
    canvas: { container: this.container },
    modules: modules
  });

  return new Diagram(options);
};


Viewer.prototype.getModules = function() {
  return this._modules;
};

/**
 * Remove all drawn elements from the viewer.
 *
 * After calling this method the viewer can still
 * be reused for opening another diagram.
 */
Viewer.prototype.clear = function() {
  var diagram = this.diagram;

  if (diagram) {
    diagram.destroy();
  }
};

/**
 * Destroy the viewer instance and remove all its remainders
 * from the document tree.
 */
Viewer.prototype.destroy = function() {
  // clear underlying diagram
  this.clear();

  // remove container
  $(this.container).remove();
};

/**
 * Register an event listener on the viewer
 *
 * @param {String} event
 * @param {Function} handler
 */
Viewer.prototype.on = function(event, handler) {
  var diagram = this.diagram,
      listeners = this.__listeners = this.__listeners || [];

  listeners.push({ event: event, handler: handler });

  if (diagram) {
    diagram.get('eventBus').on(event, handler);
  }
};

// modules the viewer is composed of
Viewer.prototype._modules = [
  _dereq_(3),
  _dereq_(133),
  _dereq_(121)
];

module.exports = Viewer;

},{}],3:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(6),
    _dereq_(32)
  ]
};
},{}],4:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var DefaultRenderer = _dereq_(70);
var TextUtil = _dereq_(156);

var DiUtil = _dereq_(33);

var createLine = DefaultRenderer.createLine;


function BpmnRenderer(events, styles, pathMap) {

  DefaultRenderer.call(this, styles);

  var TASK_BORDER_RADIUS = 10;
  var INNER_OUTER_DIST = 3;

  var LABEL_STYLE = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px'
  };

  var textUtil = new TextUtil({
    style: LABEL_STYLE,
    size: { width: 100 }
  });

  var markers = {};

  function addMarker(id, element) {
    markers[id] = element;
  }

  function marker(id) {
    return markers[id];
  }

  function initMarkers(svg) {

    function createMarker(id, options) {
      var attrs = _.extend({
        fill: 'black',
        strokeWidth: 1,
        strokeLinecap: 'round',
        strokeDasharray: 'none'
      }, options.attrs);

      var ref = options.ref || { x: 0, y: 0 };

      var scale = options.scale || 1;

      // fix for safari / chrome / firefox bug not correctly
      // resetting stroke dash array
      if (attrs.strokeDasharray === 'none') {
        attrs.strokeDasharray = [10000, 1];
      }

      var marker = options.element
                     .attr(attrs)
                     .marker(0, 0, 20, 20, ref.x, ref.y)
                     .attr({
                       markerWidth: 20 * scale,
                       markerHeight: 20 * scale
                     });

      return addMarker(id, marker);
    }


    createMarker('sequenceflow-end', {
      element: svg.path('M 1 5 L 11 10 L 1 15 Z'),
      ref: { x: 11, y: 10 },
      scale: 0.5
    });

    createMarker('messageflow-start', {
      element: svg.circle(6, 6, 5),
      attrs: {
        fill: 'white',
        stroke: 'black'
      },
      ref: { x: 6, y: 6 }
    });

    createMarker('messageflow-end', {
      element: svg.path('M 1 5 L 11 10 L 1 15 Z'),
      attrs: {
        fill: 'white',
        stroke: 'black'
      },
      ref: { x: 11, y: 10 }
    });

    createMarker('data-association-end', {
      element: svg.path('M 1 5 L 11 10 L 1 15'),
      attrs: {
        fill: 'white',
        stroke: 'black'
      },
      ref: { x: 11, y: 10 },
      scale: 0.5
    });

    createMarker('conditional-flow-marker', {
      element: svg.path('M 0 10 L 8 6 L 16 10 L 8 14 Z'),
      attrs: {
        fill: 'white',
        stroke: 'black'
      },
      ref: { x: -1, y: 10 },
      scale: 0.5
    });

    createMarker('conditional-default-flow-marker', {
      element: svg.path('M 1 4 L 5 16'),
      attrs: {
        stroke: 'black'
      },
      ref: { x: -5, y: 10 },
      scale: 0.5
    });
  }

  function computeStyle(custom, traits, defaultStyles) {
    if (!_.isArray(traits)) {
      defaultStyles = traits;
      traits = [];
    }

    return styles.style(traits || [], _.extend(defaultStyles, custom || {}));
  }

  function drawCircle(p, width, height, offset, attrs) {

    if (_.isObject(offset)) {
      attrs = offset;
      offset = 0;
    }

    offset = offset || 0;

    attrs = computeStyle(attrs, {
      stroke: 'black',
      strokeWidth: 2,
      fill: 'white'
    });

    var cx = width / 2,
        cy = height / 2;

    return p.circle(cx, cy, Math.round((width + height) / 4 - offset)).attr(attrs);
  }

  function drawRect(p, width, height, r, offset, attrs) {

    if (_.isObject(offset)) {
      attrs = offset;
      offset = 0;
    }

    offset = offset || 0;

    attrs = computeStyle(attrs, {
      stroke: 'black',
      strokeWidth: 2,
      fill: 'white'
    });

    return p.rect(offset, offset, width - offset * 2, height - offset * 2, r).attr(attrs);
  }

  function drawDiamond(p, width, height, attrs) {

    var x_2 = width / 2;
    var y_2 = height / 2;

    var points = [x_2, 0, width, y_2, x_2, height, 0, y_2 ];

    attrs = computeStyle(attrs, {
      stroke: 'black',
      strokeWidth: 2,
      fill: 'white'
    });

    return p.polygon(points).attr(attrs);
  }

  function drawLine(p, waypoints, attrs) {
    attrs = computeStyle(attrs, [ 'no-fill' ], {
      stroke: 'black',
      strokeWidth: 2,
      fill: 'none'
    });

    return createLine(waypoints, attrs).appendTo(p);
  }

  function drawPath(p, d, attrs) {

    attrs = computeStyle(attrs, [ 'no-fill' ], {
      strokeWidth: 2,
      stroke: 'black'
    });

    return p.path(d).attr(attrs);
  }

  function as(type) {
    return function(p, element) {
      return handlers[type](p, element);
    };
  }

  function renderer(type) {
    return handlers[type];
  }

  function renderEventContent(element, p) {

    var event = getSemantic(element);
    var isThrowing = isThrowEvent(event);

    if (isTypedEvent(event, 'bpmn:MessageEventDefinition')) {
      return renderer('bpmn:MessageEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:TimerEventDefinition')) {
      return renderer('bpmn:TimerEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:ConditionalEventDefinition')) {
      return renderer('bpmn:ConditionalEventDefinition')(p, element);
    }

    if (isTypedEvent(event, 'bpmn:SignalEventDefinition')) {
      return renderer('bpmn:SignalEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:CancelEventDefinition') &&
      isTypedEvent(event, 'bpmn:TerminateEventDefinition', { parallelMultiple: false })) {
      return renderer('bpmn:MultipleEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:CancelEventDefinition') &&
      isTypedEvent(event, 'bpmn:TerminateEventDefinition', { parallelMultiple: true })) {
      return renderer('bpmn:ParallelMultipleEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:EscalationEventDefinition')) {
      return renderer('bpmn:EscalationEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:LinkEventDefinition')) {
      return renderer('bpmn:LinkEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:ErrorEventDefinition')) {
      return renderer('bpmn:ErrorEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:CancelEventDefinition')) {
      return renderer('bpmn:CancelEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:CompensateEventDefinition')) {
      return renderer('bpmn:CompensateEventDefinition')(p, element, isThrowing);
    }

    if (isTypedEvent(event, 'bpmn:TerminateEventDefinition')) {
      return renderer('bpmn:TerminateEventDefinition')(p, element, isThrowing);
    }

    return null;
  }

  function renderLabel(p, label, options) {
    return textUtil.createText(p, label || '', options).addClass('djs-label');
  }

  function renderEmbeddedLabel(p, element, align) {
    var semantic = getSemantic(element);
    return renderLabel(p, semantic.name, { box: element, align: align, padding: 5 });
  }

  function renderExternalLabel(p, element, align) {
    var semantic = getSemantic(element);

    if (!semantic.name) {
      element.hidden = true;
    }

    return renderLabel(p, semantic.name, { box: element, align: align, style: { fontSize: '11px' } });
  }

  function renderLaneLabel(p, text, element) {
    var textBox = renderLabel(p, text, {
      box: { height: 30, width: element.height },
      align: 'center-middle'
    });

    var top = -1 * element.height;
    textBox.transform(
      'rotate(270) ' +
      'translate(' + top + ',' + 0 + ')'
    );
  }

  function createPathFromConnection(connection) {
    var waypoints = connection.waypoints;

    var pathData = 'm  ' + waypoints[0].x + ',' + waypoints[0].y;
    for (var i = 1; i < waypoints.length; i++) {
      pathData += 'L' + waypoints[i].x + ',' + waypoints[i].y + ' ';
    }
    return pathData;
  }

  var handlers = {
    'bpmn:Event': function(p, element, attrs) {
      return drawCircle(p, element.width, element.height,  attrs);
    },
    'bpmn:StartEvent': function(p, element) {
      var attrs = {};
      var semantic = getSemantic(element);

      if (!semantic.isInterrupting) {
        attrs = {
          strokeDasharray: '6',
          strokeLinecap: 'round'
        };
      }

      var circle = renderer('bpmn:Event')(p, element, attrs);

      renderEventContent(element, p);

      return circle;
    },
    'bpmn:MessageEventDefinition': function(p, element, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_MESSAGE', {
        xScaleFactor: 0.9,
        yScaleFactor: 0.9,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.235,
          my: 0.315
        }
      });

      var fill = isThrowing ? 'black' : 'white';
      var stroke = isThrowing ? 'white' : 'black';

      var messagePath = drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill,
        stroke: stroke
      });

      return messagePath;
    },
    'bpmn:TimerEventDefinition': function(p, element) {

      var circle = drawCircle(p, element.width, element.height, 0.2 * element.height, {
        strokeWidth: 2
      });

      var pathData = pathMap.getScaledPath('EVENT_TIMER_WH', {
        xScaleFactor: 0.75,
        yScaleFactor: 0.75,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.5,
          my: 0.5
        }
      });

      var path = drawPath(p, pathData, {
        strokeWidth: 2,
        strokeLinecap: 'square'
      });

      for(var i = 0;i < 12;i++) {

        var linePathData = pathMap.getScaledPath('EVENT_TIMER_LINE', {
          xScaleFactor: 0.75,
          yScaleFactor: 0.75,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.5,
            my: 0.5
          }
        });

        var width = element.width / 2;
        var height = element.height / 2;

        var linePath = drawPath(p, linePathData, {
          strokeWidth: 1,
          strokeLinecap: 'square',
          transform: 'rotate(' + (i * 30) + ',' + height + ',' + width + ')'
        });
      }

      return circle;
    },
    'bpmn:EscalationEventDefinition': function(p, event, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_ESCALATION', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.555
        }
      });

      var fill = isThrowing ? 'black' : 'none';

      return drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill
      });
    },
    'bpmn:ConditionalEventDefinition': function(p, event) {
      var pathData = pathMap.getScaledPath('EVENT_CONDITIONAL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.222
        }
      });

      return drawPath(p, pathData, {
        strokeWidth: 1
      });
    },
    'bpmn:LinkEventDefinition': function(p, event) {
      var pathData = pathMap.getScaledPath('EVENT_LINK', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.57,
          my: 0.263
        }
      });

      return drawPath(p, pathData, {
        strokeWidth: 1
      });
    },
    'bpmn:ErrorEventDefinition': function(p, event, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_ERROR', {
        xScaleFactor: 1.1,
        yScaleFactor: 1.1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.2,
          my: 0.722
        }
      });

      var fill = isThrowing ? 'black' : 'none';

      return drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill
      });
    },
    'bpmn:CancelEventDefinition': function(p, event, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_CANCEL_45', {
        xScaleFactor: 1.0,
        yScaleFactor: 1.0,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.638,
          my: -0.055
        }
      });

      var fill = isThrowing ? 'black' : 'none';

      return drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill
      }).transform('rotate(45)');
    },
    'bpmn:CompensateEventDefinition': function(p, event, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_COMPENSATION', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.201,
          my: 0.472
        }
      });

      var fill = isThrowing ? 'black' : 'none';

      return drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill
      });
    },
    'bpmn:SignalEventDefinition': function(p, event, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_SIGNAL', {
        xScaleFactor: 0.9,
        yScaleFactor: 0.9,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.5,
          my: 0.2
        }
      });

      var fill = isThrowing ? 'black' : 'none';

      return drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill
      });
    },
    'bpmn:MultipleEventDefinition': function(p, event, isThrowing) {
      var pathData = pathMap.getScaledPath('EVENT_MULTIPLE', {
        xScaleFactor: 1.1,
        yScaleFactor: 1.1,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.222,
          my: 0.36
        }
      });

      var fill = isThrowing ? 'black' : 'none';

      return drawPath(p, pathData, {
        strokeWidth: 1,
        fill: fill
      });
    },
    'bpmn:ParallelMultipleEventDefinition': function(p, event) {
      var pathData = pathMap.getScaledPath('EVENT_PARALLEL_MULTIPLE', {
        xScaleFactor: 1.2,
        yScaleFactor: 1.2,
        containerWidth: event.width,
        containerHeight: event.height,
        position: {
          mx: 0.458,
          my: 0.194
        }
      });

      return drawPath(p, pathData, {
        strokeWidth: 1
      });
    },
    'bpmn:EndEvent': function(p, element) {
      var circle = renderer('bpmn:Event')(p, element, {
        strokeWidth: 4
      });

      renderEventContent(element, p, true);

      return circle;
    },
    'bpmn:TerminateEventDefinition': function(p, element) {
      var circle = drawCircle(p, element.width, element.height, 8, {
        strokeWidth: 4,
        fill: 'black'
      });

      return circle;
    },
    'bpmn:IntermediateEvent': function(p, element) {
      var outer = renderer('bpmn:Event')(p, element, { strokeWidth: 1 });
      var inner = drawCircle(p, element.width, element.height, INNER_OUTER_DIST, { strokeWidth: 1, fill: 'none' });

      renderEventContent(element, p);

      return outer;
    },
    'bpmn:IntermediateCatchEvent': as('bpmn:IntermediateEvent'),
    'bpmn:IntermediateThrowEvent': as('bpmn:IntermediateEvent'),

    'bpmn:Activity': function(p, element, attrs) {
      return drawRect(p, element.width, element.height, TASK_BORDER_RADIUS, attrs);
    },

    'bpmn:Task': function(p, element) {
      var rect = renderer('bpmn:Activity')(p, element);
      renderEmbeddedLabel(p, element, 'center-middle');
      attachTaskMarkers(p, element);
      return rect;
    },
    'bpmn:ServiceTask': function(p, element) {
      var task = renderer('bpmn:Task')(p, element);

      var pathDataBG = pathMap.getScaledPath('TASK_TYPE_SERVICE', {
        abspos: {
          x: 12,
          y: 18
        }
      });

      var servicePathBG = drawPath(p, pathDataBG, {
        strokeWidth: 1,
        fill: 'none'
      });

      var fillPathData = pathMap.getScaledPath('TASK_TYPE_SERVICE_FILL', {
        abspos: {
          x: 17.2,
          y: 18
        }
      });

      var serviceFillPath = drawPath(p, fillPathData, {
        strokeWidth: 0,
        stroke: 'none',
        fill: 'white'
      });

      var pathData = pathMap.getScaledPath('TASK_TYPE_SERVICE', {
        abspos: {
          x: 17,
          y: 22
        }
      });

      var servicePath = drawPath(p, pathData, {
        strokeWidth: 1,
        fill: 'white'
      });

      return task;
    },
    'bpmn:UserTask': function(p, element) {
      var task = renderer('bpmn:Task')(p, element);

      var x = 15;
      var y = 12;

      var pathData = pathMap.getScaledPath('TASK_TYPE_USER_1', {
        abspos: {
          x: x,
          y: y
        }
      });

      var userPath = drawPath(p, pathData, {
        strokeWidth: 0.5,
        fill: 'none'
      });

      var pathData2 = pathMap.getScaledPath('TASK_TYPE_USER_2', {
        abspos: {
          x: x,
          y: y
        }
      });

      var userPath2 = drawPath(p, pathData2, {
        strokeWidth: 0.5,
        fill: 'none'
      });

      var pathData3 = pathMap.getScaledPath('TASK_TYPE_USER_3', {
        abspos: {
          x: x,
          y: y
        }
      });

      var userPath3 = drawPath(p, pathData3, {
        strokeWidth: 0.5,
        fill: 'black'
      });

      return task;
    },
    'bpmn:ManualTask': function(p, element) {
      var task = renderer('bpmn:Task')(p, element);

      var pathData = pathMap.getScaledPath('TASK_TYPE_MANUAL', {
        abspos: {
          x: 17,
          y: 15
        }
      });

      var userPath = drawPath(p, pathData, {
        strokeWidth: 0.25,
        fill: 'white',
        stroke: 'black'
      });

      return task;
    },
    'bpmn:SendTask': function(p, element) {
      var task = renderer('bpmn:Task')(p, element);

      var pathData = pathMap.getScaledPath('TASK_TYPE_SEND', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: 21,
        containerHeight: 14,
        position: {
          mx: 0.285,
          my: 0.357
        }
      });

      var sendPath = drawPath(p, pathData, {
        strokeWidth: 1,
        fill: 'black',
        stroke: 'white'
      });

      return task;
    },
    'bpmn:ReceiveTask' : function(p, element) {
      var semantic = getSemantic(element);

      var task = renderer('bpmn:Task')(p, element);
      var pathData;

      if (semantic.instantiate) {
        drawCircle(p, 28, 28, 20 * 0.22, { strokeWidth: 1 });

        pathData = pathMap.getScaledPath('TASK_TYPE_INSTANTIATING_SEND', {
          abspos: {
            x: 7.77,
            y: 9.52
          }
        });
      } else {

        pathData = pathMap.getScaledPath('TASK_TYPE_SEND', {
          xScaleFactor: 0.9,
          yScaleFactor: 0.9,
          containerWidth: 21,
          containerHeight: 14,
          position: {
            mx: 0.3,
            my: 0.4
          }
        });
      }

      var sendPath = drawPath(p, pathData, {
        strokeWidth: 1
      });

      return task;
    },
    'bpmn:ScriptTask': function(p, element) {
      var task = renderer('bpmn:Task')(p, element);

      var pathData = pathMap.getScaledPath('TASK_TYPE_SCRIPT', {
        abspos: {
          x: 15,
          y: 20
        }
      });

      var scriptPath = drawPath(p, pathData, {
        strokeWidth: 1
      });

      return task;
    },
    'bpmn:BusinessRuleTask': function(p, element) {
      var task = renderer('bpmn:Task')(p, element);

      var headerPathData = pathMap.getScaledPath('TASK_TYPE_BUSINESS_RULE_HEADER', {
        abspos: {
          x: 8,
          y: 8
        }
      });

      var businessHeaderPath = drawPath(p, headerPathData);
      businessHeaderPath.attr({
        strokeWidth: 1,
        fill: 'AAA'
      });

      var headerData = pathMap.getScaledPath('TASK_TYPE_BUSINESS_RULE_MAIN', {
        abspos: {
          x: 8,
          y: 8
        }
      });

      var businessPath = drawPath(p, headerData);
      businessPath.attr({
        strokeWidth: 1
      });

      return task;
    },
    'bpmn:SubProcess': function(p, element, attrs) {
      var rect = renderer('bpmn:Activity')(p, element, attrs);

      var semantic = getSemantic(element),
          di = getDi(element);

      var expanded = DiUtil.isExpanded(semantic);

      var isEventSubProcess = !!semantic.triggeredByEvent;
      if (isEventSubProcess) {
        rect.attr({
          strokeDasharray: '1,2'
        });
      }

      renderEmbeddedLabel(p, element, expanded ? 'center-top' : 'center-middle');

      if (expanded) {
        attachTaskMarkers(p, element);
      } else {
        attachTaskMarkers(p, element, ['SubProcessMarker']);
      }

      return rect;
    },
    'bpmn:AdHocSubProcess': function(p, element) {
      return renderer('bpmn:SubProcess')(p, element);
    },
    'bpmn:Transaction': function(p, element) {
      var outer = renderer('bpmn:SubProcess')(p, element);

      var innerAttrs = styles.style([ 'no-fill', 'no-events' ]);
      var inner = drawRect(p, element.width, element.height, TASK_BORDER_RADIUS - 2, INNER_OUTER_DIST, innerAttrs);

      return outer;
    },
    'bpmn:CallActivity': function(p, element) {
      return renderer('bpmn:SubProcess')(p, element, {
        strokeWidth: 5
      });
    },
    'bpmn:Participant': function(p, element) {

      var lane = renderer('bpmn:Lane')(p, element);

      var expandedPool = DiUtil.isExpandedPool(getSemantic(element));

      if (expandedPool) {
        drawLine(p, [
          { x: 30, y: 0 },
          { x: 30, y: element.height }
        ]);
        var text = getSemantic(element).name;
        renderLaneLabel(p, text, element);
      } else {
        // Collapsed pool draw text inline
        var text2 = getSemantic(element).name;
        renderLabel(p, text2, { box: element, align: 'center-middle' });
      }

      var participantMultiplicity = !!(getSemantic(element).participantMultiplicity);

      if(participantMultiplicity) {
        renderer('ParticipantMultiplicityMarker')(p, element);
      }

      return lane;
    },
    'bpmn:Lane': function(p, element) {
      var rect = drawRect(p, element.width, element.height, 0, {
        fill: 'none'
      });

      var semantic = getSemantic(element);

      if (semantic.$type === 'bpmn:Lane') {
        var text = semantic.name;
        renderLaneLabel(p, text, element);
      }

      return rect;
    },
    'bpmn:InclusiveGateway': function(p, element) {
      var diamond = drawDiamond(p, element.width, element.height);

      var circle = drawCircle(p, element.width, element.height, element.height * 0.24, {
        strokeWidth: 2.5,
        fill: 'none'
      });

      return diamond;
    },
    'bpmn:ExclusiveGateway': function(p, element) {
      var diamond = drawDiamond(p, element.width, element.height);

      var pathData = pathMap.getScaledPath('GATEWAY_EXCLUSIVE', {
        xScaleFactor: 0.4,
        yScaleFactor: 0.4,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.32,
          my: 0.3
        }
      });

      if (!!(getDi(element).isMarkerVisible)) {
        drawPath(p, pathData, {
          strokeWidth: 1,
          fill: 'black'
        });
      }

      return diamond;
    },
    'bpmn:ComplexGateway': function(p, element) {
      var diamond = drawDiamond(p, element.width, element.height);

      var pathData = pathMap.getScaledPath('GATEWAY_COMPLEX', {
        xScaleFactor: 0.5,
        yScaleFactor:0.5,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.46,
          my: 0.26
        }
      });

      var complexPath = drawPath(p, pathData, {
        strokeWidth: 1,
        fill: 'black'
      });

      return diamond;
    },
    'bpmn:ParallelGateway': function(p, element) {
      var diamond = drawDiamond(p, element.width, element.height);

      var pathData = pathMap.getScaledPath('GATEWAY_PARALLEL', {
        xScaleFactor: 0.6,
        yScaleFactor:0.6,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.46,
          my: 0.2
        }
      });

      var parallelPath = drawPath(p, pathData, {
        strokeWidth: 1,
        fill: 'black'
      });

      return diamond;
    },
    'bpmn:EventBasedGateway': function(p, element) {

      var semantic = getSemantic(element);

      var diamond = drawDiamond(p, element.width, element.height);

      var outerCircle = drawCircle(p, element.width, element.height, element.height * 0.20, {
        strokeWidth: 1,
        fill: 'none'
      });

      var type = semantic.eventGatewayType;
      var instantiate = !!semantic.instantiate;

      function drawEvent() {

        var pathData = pathMap.getScaledPath('GATEWAY_EVENT_BASED', {
          xScaleFactor: 0.18,
          yScaleFactor: 0.18,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.36,
            my: 0.44
          }
        });

        var eventPath = drawPath(p, pathData, {
          strokeWidth: 2,
          fill: 'none'
        });
      }

      if (type === 'Parallel') {

        var pathData = pathMap.getScaledPath('GATEWAY_PARALLEL', {
          xScaleFactor: 0.4,
          yScaleFactor:0.4,
          containerWidth: element.width,
          containerHeight: element.height,
          position: {
            mx: 0.474,
            my: 0.296
          }
        });

        var parallelPath = drawPath(p, pathData);
        parallelPath.attr({
          strokeWidth: 1,
          fill: 'none'
        });
      } else if (type === 'Exclusive') {

        if (!instantiate) {
          var innerCircle = drawCircle(p, element.width, element.height, element.height * 0.26);
          innerCircle.attr({
            strokeWidth: 1,
            fill: 'none'
          });
        }

        drawEvent();
      }


      return diamond;
    },
    'bpmn:Gateway': function(p, element) {
      return drawDiamond(p, element.width, element.height);
    },
    'bpmn:SequenceFlow': function(p, element) {
      var pathData = createPathFromConnection(element);
      var path = drawPath(p, pathData, {
        markerEnd: marker('sequenceflow-end')
      });

      var sequenceFlow = getSemantic(element);
      var source = element.source.businessObject;

      // conditional flow marker
      if (sequenceFlow.conditionExpression && source.$instanceOf('bpmn:Task')) {
        path.attr({
          markerStart: marker('conditional-flow-marker')
        });
      }

      // default marker
      if (source.default && source.$instanceOf('bpmn:Gateway') && source.default === sequenceFlow) {
        path.attr({
          markerStart: marker('conditional-default-flow-marker')
        });
      }

      return path;
    },
    'bpmn:Association': function(p, element, attrs) {

      attrs = _.extend({
        strokeDasharray: '1,6',
        strokeLinecap: 'round'
      }, attrs || {});

      // TODO(nre): style according to directed state
      return drawLine(p, element.waypoints, attrs);
    },
    'bpmn:DataInputAssociation': function(p, element) {
      return renderer('bpmn:Association')(p, element, {
        markerEnd: marker('data-association-end')
      });
    },
    'bpmn:DataOutputAssociation': function(p, element) {
      return renderer('bpmn:Association')(p, element, {
        markerEnd: marker('data-association-end')
      });
    },
    'bpmn:MessageFlow': function(p, element) {

      var di = getDi(element);

      var pathData = createPathFromConnection(element);
      var path = drawPath(p, pathData, {
        markerEnd: marker('messageflow-end'),
        markerStart: marker('messageflow-start'),
        strokeDasharray: '10',
        strokeLinecap: 'round',
        strokeWidth: 1
      });

      if (!!di.messageVisibleKind) {
        var midPoint = path.getPointAtLength(path.getTotalLength() / 2);

        var markerPathData = pathMap.getScaledPath('MESSAGE_FLOW_MARKER', {
          abspos: {
            x: midPoint.x,
            y: midPoint.y
          }
        });

        var messageAttrs = { strokeWidth: 1 };

        if (di.messageVisibleKind === 'initiating') {
          messageAttrs.fill = 'white';
          messageAttrs.stroke = 'black';
        } else {
          messageAttrs.fill = '#888';
          messageAttrs.stroke = 'white';
        }

        drawPath(p, markerPathData, messageAttrs);
      }

      return path;
    },
    'bpmn:DataObject': function(p, element) {
      var pathData = pathMap.getScaledPath('DATA_OBJECT_PATH', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.474,
          my: 0.296
        }
      });

      var elementObject = drawPath(p, pathData, { fill: 'white' });

      var semantic = getSemantic(element);

      if (isCollection(semantic)) {
        renderDataItemCollection(p, element);
      }

      return elementObject;
    },
    'bpmn:DataObjectReference': as('bpmn:DataObject'),
    'bpmn:DataInput': function(p, element) {

      var arrowPathData = pathMap.getRawPath('DATA_ARROW');

      // page
      var elementObject = renderer('bpmn:DataObject')(p, element);

      // arrow
      var elementInput = drawPath(p, arrowPathData, { strokeWidth: 1 });

      return elementObject;
    },
    'bpmn:DataOutput': function(p, element) {
      var arrowPathData = pathMap.getRawPath('DATA_ARROW');

      // page
      var elementObject = renderer('bpmn:DataObject')(p, element);

      // arrow
      var elementInput = drawPath(p, arrowPathData, {
        strokeWidth: 1,
        fill: 'black'
      });

      return elementObject;
    },
    'bpmn:DataStoreReference': function(p, element) {
      var DATA_STORE_PATH = pathMap.getScaledPath('DATA_STORE', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0,
          my: 0.133
        }
      });

      var elementStore = drawPath(p, DATA_STORE_PATH, {
        strokeWidth: 2,
        fill: 'white'
      });

      return elementStore;
    },
    'bpmn:BoundaryEvent': function(p, element) {

      var semantic = getSemantic(element),
          cancel = semantic.cancelActivity;

      var attrs = {
        strokeLinecap: 'round',
        strokeWidth: 1
      };

      if (!cancel) {
        attrs.strokeDasharray = '6';
      }

      var outer = renderer('bpmn:Event')(p, element, attrs);
      var inner = drawCircle(p, element.width, element.height, INNER_OUTER_DIST, attrs);

      renderEventContent(element, p);

      return outer;
    },
    'bpmn:Group': function(p, element) {
      return drawRect(p, element.width, element.height, TASK_BORDER_RADIUS, {
        strokeWidth: 1,
        strokeDasharray: '8,3,1,3',
        fill: 'none',
        pointerEvents: 'none'
      });
    },
    'label': function(p, element) {
      return renderExternalLabel(p, element, '');
    },
    'bpmn:TextAnnotation': function(p, element) {
      var style = {
        'fill': 'none',
        'stroke': 'none'
      };
      var textElement = drawRect(p, element.width, element.height, 0, 0, style);
      var textPathData = pathMap.getScaledPath('TEXT_ANNOTATION', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.0,
          my: 0.0
        }
      });
      drawPath(p, textPathData);

      var text = getSemantic(element).text || '';
      renderLabel(p, text, { box: element, align: 'left-middle', padding: 5 });

      return textElement;
    },
    'ParticipantMultiplicityMarker': function(p, element) {
      var subProcessPath = pathMap.getScaledPath('MARKER_PARALLEL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2) / element.width),
          my: (element.height - 15) / element.height
        }
      });

      drawPath(p, subProcessPath);
    },
    'SubProcessMarker': function(p, element) {
      var markerRect = drawRect(p, 14, 14, 0, {
        strokeWidth: 1
      });

      // Process marker is placed in the middle of the box
      // therefore fixed values can be used here
      markerRect.transform('translate(' + (element.width / 2 - 7.5) + ',' + (element.height - 20) + ')');

      var subProcessPath = pathMap.getScaledPath('MARKER_SUB_PROCESS', {
        xScaleFactor: 1.5,
        yScaleFactor: 1.5,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 - 7.5) / element.width,
          my: (element.height - 20) / element.height
        }
      });

      drawPath(p, subProcessPath);
    },
    'ParallelMarker': function(p, element, position) {
      var subProcessPath = pathMap.getScaledPath('MARKER_PARALLEL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 + position.parallel) / element.width),
          my: (element.height - 20) / element.height
        }
      });
      drawPath(p, subProcessPath);
    },
    'SequentialMarker': function(p, element, position) {
      var sequentialPath = pathMap.getScaledPath('MARKER_SEQUENTIAL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 + position.seq) / element.width),
          my: (element.height - 19) / element.height
        }
      });
      drawPath(p, sequentialPath);
    },
    'CompensationMarker': function(p, element, position) {
      var compensationPath = pathMap.getScaledPath('MARKER_COMPENSATION', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 + position.compensation) / element.width),
          my: (element.height - 13) / element.height
        }
      });
      drawPath(p, compensationPath, { strokeWidth: 1 });
    },
    'LoopMarker': function(p, element, position) {
      var loopPath = pathMap.getScaledPath('MARKER_LOOP', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 + position.loop) / element.width),
          my: (element.height - 7) / element.height
        }
      });

      drawPath(p, loopPath, {
        strokeWidth: 1,
        fill: 'none',
        strokeLinecap: 'round',
        strokeMiterlimit: 0.5
      });
    },
    'AdhocMarker': function(p, element, position) {
      var loopPath = pathMap.getScaledPath('MARKER_ADHOC', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 + position.adhoc) / element.width),
          my: (element.height - 15) / element.height
        }
      });

      drawPath(p, loopPath, {
        strokeWidth: 1,
        fill: 'black'
      });
    }
  };

  function attachTaskMarkers(p, element, taskMarkers) {
    var obj = getSemantic(element);

    var subprocess = _.contains(taskMarkers, 'SubProcessMarker');
    var position;

    if (subprocess) {
      position = {
        seq: -21,
        parallel: -22,
        compensation: -42,
        loop: -18,
        adhoc: 10
      };
    } else {
      position = {
        seq: -3,
        parallel: -6,
        compensation: -27,
        loop: 0,
        adhoc: 10
      };
    }

    _.forEach(taskMarkers, function(marker) {
      renderer(marker)(p, element, position);
    });

    if (obj.$type === 'bpmn:AdHocSubProcess') {
      renderer('AdhocMarker')(p, element, position);
    }
    if (obj.loopCharacteristics && obj.loopCharacteristics.isSequential === undefined) {
      renderer('LoopMarker')(p, element, position);
      return;
    }
    if (obj.loopCharacteristics &&
      obj.loopCharacteristics.isSequential !== undefined &&
      !obj.loopCharacteristics.isSequential) {
      renderer('ParallelMarker')(p, element, position);
    }
    if (obj.loopCharacteristics && !!obj.loopCharacteristics.isSequential) {
      renderer('SequentialMarker')(p, element, position);
    }
    if (!!obj.isForCompensation) {
      renderer('CompensationMarker')(p, element, position);
    }
  }

  function drawShape(parent, element) {
    var type = element.type;
    var h = handlers[type];

    /* jshint -W040 */
    if (!h) {
      return DefaultRenderer.prototype.drawShape.apply(this, [ parent, element ]);
    } else {
      return h(parent, element);
    }
  }

  function drawConnection(parent, element) {
    var type = element.type;
    var h = handlers[type];

    /* jshint -W040 */
    if (!h) {
      return DefaultRenderer.prototype.drawConnection.apply(this, [ parent, element ]);
    } else {
      return h(parent, element);
    }
  }

  function renderDataItemCollection(p, element) {

    var yPosition = (element.height - 16) / element.height;

    var pathData = pathMap.getScaledPath('DATA_OBJECT_COLLECTION_PATH', {
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: element.width,
      containerHeight: element.height,
      position: {
        mx: 0.451,
        my: yPosition
      }
    });

    var collectionPath = drawPath(p, pathData, {
      strokeWidth: 2
    });
  }

  function isCollection(element, filter) {
    return element.isCollection ||
           (element.elementObjectRef && element.elementObjectRef.isCollection);
  }

  function getDi(element) {
    return element.businessObject.di;
  }

  function getSemantic(element) {
    return element.businessObject;
  }

  /**
   * Checks if eventDefinition of the given element matches with semantic type.
   *
   * @return {boolean} true if element is of the given semantic type
   */
  function isTypedEvent(event, eventDefinitionType, filter) {

    function matches(definition, filter) {
      return _.all(filter, function(val, key) {

        // we want a == conversion here, to be able to catch
        // undefined == false and friends
        /* jshint -W116 */
        return definition[key] == val;
      });
    }

    return _.any(event.eventDefinitions, function(definition) {
      return definition.$type === eventDefinitionType && matches(event, filter);
    });
  }

  function isThrowEvent(event) {
    return (event.$type === 'bpmn:IntermediateThrowEvent') || (event.$type === 'bpmn:EndEvent');
  }

  // hook onto canvas init event to initialize
  // connection start/end markers on svg
  events.on('canvas.init', function(event) {
    initMarkers(event.svg);
  });

  this.drawShape = drawShape;
  this.drawConnection = drawConnection;
}

BpmnRenderer.prototype = Object.create(DefaultRenderer.prototype);


BpmnRenderer.$inject = [ 'eventBus', 'styles', 'pathMap' ];

module.exports = BpmnRenderer;
},{}],5:[function(_dereq_,module,exports){
'use strict';

/**
 * Map containing SVG paths needed by BpmnRenderer.
 */

function PathMap(Snap) {

  /**
   * Contains a map of path elements
   *
   * <h1>Path definition</h1>
   * A parameterized path is defined like this:
   * <pre>
   * 'GATEWAY_PARALLEL': {
   *   d: 'm {mx},{my} {e.x0},0 0,{e.x1} {e.x1},0 0,{e.y0} -{e.x1},0 0,{e.y1} ' +
          '-{e.x0},0 0,-{e.y1} -{e.x1},0 0,-{e.y0} {e.x1},0 z',
   *   height: 17.5,
   *   width:  17.5,
   *   heightElements: [2.5, 7.5],
   *   widthElements: [2.5, 7.5]
   * }
   * </pre>
   * <p>It's important to specify a correct <b>height and width</b> for the path as the scaling
   * is based on the ratio between the specified height and width in this object and the
   * height and width that is set as scale target (Note x,y coordinates will be scaled with
   * individual ratios).</p>
   * <p>The '<b>heightElements</b>' and '<b>widthElements</b>' array must contain the values that will be scaled.
   * The scaling is based on the computed ratios.
   * Coordinates on the y axis should be in the <b>heightElement</b>'s array, they will be scaled using
   * the computed ratio coefficient.
   * In the parameterized path the scaled values can be accessed through the 'e' object in {} brackets.
   *   <ul>
   *    <li>The values for the y axis can be accessed in the path string using {e.y0}, {e.y1}, ....</li>
   *    <li>The values for the x axis can be accessed in the path string using {e.x0}, {e.x1}, ....</li>
   *   </ul>
   *   The numbers x0, x1 respectively y0, y1, ... map to the corresponding array index.
   * </p>
   */
  this.pathMap = {
    'EVENT_MESSAGE': {
      d: 'm {mx},{my} l 0,{e.y1} l {e.x1},0 l 0,-{e.y1} z l {e.x0},{e.y0} l {e.x0},-{e.y0}',
      height: 36,
      width:  36,
      heightElements: [6, 14],
      widthElements: [10.5, 21]
    },
    'EVENT_SIGNAL': {
      d: 'M {mx},{my} l {e.x0},{e.y0} l -{e.x1},0 Z',
      height: 36,
      width: 36,
      heightElements: [18],
      widthElements: [10, 20]
    },
    'EVENT_ESCALATION': {
      d: 'm {mx},{my} c -{e.x1},{e.y0} -{e.x3},{e.y1} -{e.x5},{e.y4} {e.x1},-{e.y3} {e.x3},-{e.y5} {e.x5},-{e.y6} ' +
        '{e.x0},{e.y3} {e.x2},{e.y5} {e.x4},{e.y6} -{e.x0},-{e.y0} -{e.x2},-{e.y1} -{e.x4},-{e.y4} z',
      height: 36,
      width: 36,
      heightElements: [2.382, 4.764, 4.926, 6.589333, 7.146, 13.178667, 19.768],
      widthElements: [2.463, 2.808, 4.926, 5.616, 7.389, 8.424]
    },
    'EVENT_CONDITIONAL': {
      d: 'M {e.x0},{e.y0} l {e.x1},0 l 0,{e.y2} l -{e.x1},0 Z ' +
         'M {e.x2},{e.y3} l {e.x0},0 ' +
         'M {e.x2},{e.y4} l {e.x0},0 ' +
         'M {e.x2},{e.y5} l {e.x0},0 ' +
         'M {e.x2},{e.y6} l {e.x0},0 ' +
         'M {e.x2},{e.y7} l {e.x0},0 ' +
         'M {e.x2},{e.y8} l {e.x0},0 ',
      height: 36,
      width:  36,
      heightElements: [8.5, 14.5, 18, 11.5, 14.5, 17.5, 20.5, 23.5, 26.5],
      widthElements:  [10.5, 14.5, 12.5]
    },
    'EVENT_LINK': {
      d: 'm {mx},{my} 0,{e.y0} -{e.x1},0 0,{e.y1} {e.x1},0 0,{e.y0} {e.x0},-{e.y2} -{e.x0},-{e.y2} z',
      height: 36,
      width: 36,
      heightElements: [4.4375, 6.75, 7.8125],
      widthElements: [9.84375, 13.5]
    },
    'EVENT_ERROR': {
      d: 'm {mx},{my} {e.x0},-{e.y0} {e.x1},-{e.y1} {e.x2},{e.y2} {e.x3},-{e.y3} -{e.x4},{e.y4} -{e.x5},-{e.y5} z',
      height: 36,
      width: 36,
      heightElements: [0.023, 8.737, 8.151, 16.564, 10.591, 8.714],
      widthElements: [0.085, 6.672, 6.97, 4.273, 5.337, 6.636]
    },
    'EVENT_CANCEL_45': {
      d: 'm {mx},{my} -{e.x1},0 0,{e.x0} {e.x1},0 0,{e.y1} {e.x0},0 ' +
        '0,-{e.y1} {e.x1},0 0,-{e.y0} -{e.x1},0 0,-{e.y1} -{e.x0},0 z',
      height: 36,
      width: 36,
      heightElements: [4.75, 8.5],
      widthElements: [4.75, 8.5]
    },
    'EVENT_COMPENSATION': {
      d: 'm {mx},{my} {e.x0},-{e.y0} 0,{e.y1} z m {e.x0},0 {e.x0},-{e.y0} 0,{e.y1} z',
      height: 36,
      width: 36,
      heightElements: [5, 10],
      widthElements: [10]
    },
    'EVENT_TIMER_WH': {
      d: 'M {mx},{my} l {e.x0},-{e.y0} m -{e.x0},{e.y0} l {e.x1},{e.y1} ',
      height: 36,
      width:  36,
      heightElements: [10, 2],
      widthElements: [3, 7]
    },
    'EVENT_TIMER_LINE': {
      d:  'M {mx},{my} ' +
          'm {e.x0},{e.y0} l -{e.x1},{e.y1} ',
      height: 36,
      width:  36,
      heightElements: [10, 3],
      widthElements: [0, 0]
    },
    'EVENT_MULTIPLE': {
      d:'m {mx},{my} {e.x1},-{e.y0} {e.x1},{e.y0} -{e.x0},{e.y1} -{e.x2},0 z',
      height: 36,
      width:  36,
      heightElements: [6.28099, 12.56199],
      widthElements: [3.1405, 9.42149, 12.56198]
    },
    'EVENT_PARALLEL_MULTIPLE': {
      d:'m {mx},{my} {e.x0},0 0,{e.y1} {e.x1},0 0,{e.y0} -{e.x1},0 0,{e.y1} ' +
        '-{e.x0},0 0,-{e.y1} -{e.x1},0 0,-{e.y0} {e.x1},0 z',
      height: 36,
      width:  36,
      heightElements: [2.56228, 7.68683],
      widthElements: [2.56228, 7.68683]
    },
    'GATEWAY_EXCLUSIVE': {
      d:'m {mx},{my} {e.x0},{e.y0} {e.x1},{e.y0} {e.x2},0 {e.x4},{e.y2} ' +
                    '{e.x4},{e.y1} {e.x2},0 {e.x1},{e.y3} {e.x0},{e.y3} ' +
                    '{e.x3},0 {e.x5},{e.y1} {e.x5},{e.y2} {e.x3},0 z',
      height: 17.5,
      width:  17.5,
      heightElements: [8.5, 6.5312, -6.5312, -8.5],
      widthElements:  [6.5, -6.5, 3, -3, 5, -5]
    },
    'GATEWAY_PARALLEL': {
      d:'m {mx},{my} 0,{e.y1} -{e.x1},0 0,{e.y0} {e.x1},0 0,{e.y1} {e.x0},0 ' +
        '0,-{e.y1} {e.x1},0 0,-{e.y0} -{e.x1},0 0,-{e.y1} -{e.x0},0 z',
      height: 30,
      width:  30,
      heightElements: [5, 12.5],
      widthElements: [5, 12.5]
    },
    'GATEWAY_EVENT_BASED': {
      d:'m {mx},{my} {e.x0},{e.y0} {e.x0},{e.y1} {e.x1},{e.y2} {e.x2},0 z',
      height: 11,
      width:  11,
      heightElements: [-6, 6, 12, -12],
      widthElements: [9, -3, -12]
    },
    'GATEWAY_COMPLEX': {
      d:'m {mx},{my} 0,{e.y0} -{e.x0},-{e.y1} -{e.x1},{e.y2} {e.x0},{e.y1} -{e.x2},0 0,{e.y3} ' +
        '{e.x2},0  -{e.x0},{e.y1} l {e.x1},{e.y2} {e.x0},-{e.y1} 0,{e.y0} {e.x3},0 0,-{e.y0} {e.x0},{e.y1} ' +
        '{e.x1},-{e.y2} -{e.x0},-{e.y1} {e.x2},0 0,-{e.y3} -{e.x2},0 {e.x0},-{e.y1} -{e.x1},-{e.y2} ' +
        '-{e.x0},{e.y1} 0,-{e.y0} -{e.x3},0 z',
      height: 17.125,
      width:  17.125,
      heightElements: [4.875, 3.4375, 2.125, 3],
      widthElements: [3.4375, 2.125, 4.875, 3]
    },
    'DATA_OBJECT_PATH': {
      d:'m 0,0 {e.x1},0 {e.x0},{e.y0} 0,{e.y1} -{e.x2},0 0,-{e.y2} {e.x1},0 0,{e.y0} {e.x0},0',
      height: 61,
      width:  51,
      heightElements: [10, 50, 60],
      widthElements: [10, 40, 50, 60]
    },
    'DATA_OBJECT_COLLECTION_PATH': {
      d:'m {mx}, {my} ' +
        'm  0 15  l 0 -15 ' +
        'm  4 15  l 0 -15 ' +
        'm  4 15  l 0 -15 ',
      height: 61,
      width:  51,
      heightElements: [12],
      widthElements: [1, 6, 12, 15]
    },
    'DATA_ARROW': {
      d:'m 5,9 9,0 0,-3 5,5 -5,5 0,-3 -9,0 z',
      height: 61,
      width:  51,
      heightElements: [],
      widthElements: []
    },
    'DATA_STORE': {
      d:'m  {mx},{my} ' +
        'l  0,{e.y2} ' +
        'c  {e.x0},{e.y1} {e.x1},{e.y1}  {e.x2},0 ' +
        'l  0,-{e.y2} ' +
        'c -{e.x0},-{e.y1} -{e.x1},-{e.y1} -{e.x2},0' +
        'c  {e.x0},{e.y1} {e.x1},{e.y1}  {e.x2},0 ' +
        'm  -{e.x2},{e.y0}' +
        'c  {e.x0},{e.y1} {e.x1},{e.y1} {e.x2},0' +
        'm  -{e.x2},{e.y0}' +
        'c  {e.x0},{e.y1} {e.x1},{e.y1}  {e.x2},0',
      height: 61,
      width:  61,
      heightElements: [7, 10, 45],
      widthElements:  [2, 58, 60]
    },
    'TEXT_ANNOTATION': {
      d: 'm {mx}, {my} m 10,0 l -10,0 l 0,{e.y0} l 10,0',
      height: 30,
      width: 10,
      heightElements: [30],
      widthElements: [10]
    },
    'MARKER_SUB_PROCESS': {
      d: 'm{mx},{my} m 7,2 l 0,10 m -5,-5 l 10,0',
      height: 10,
      width: 10,
      heightElements: [],
      widthElements: []
    },
    'MARKER_PARALLEL': {
      d: 'm{mx},{my} m 3,2 l 0,10 m 3,-10 l 0,10 m 3,-10 l 0,10',
      height: 10,
      width: 10,
      heightElements: [],
      widthElements: []
    },
    'MARKER_SEQUENTIAL': {
      d: 'm{mx},{my} m 0,3 l 10,0 m -10,3 l 10,0 m -10,3 l 10,0',
      height: 10,
      width: 10,
      heightElements: [],
      widthElements: []
    },
    'MARKER_COMPENSATION': {
      d: 'm {mx},{my} 8,-5 0,10 z m 9,0 8,-5 0,10 z',
      height: 10,
      width: 21,
      heightElements: [],
      widthElements: []
    },
    'MARKER_LOOP': {
      d: 'm {mx},{my} c 3.526979,0 6.386161,-2.829858 6.386161,-6.320661 0,-3.490806 -2.859182,-6.320661 ' +
        '-6.386161,-6.320661 -3.526978,0 -6.38616,2.829855 -6.38616,6.320661 0,1.745402 ' +
        '0.714797,3.325567 1.870463,4.469381 0.577834,0.571908 1.265885,1.034728 2.029916,1.35457 ' +
        'l -0.718163,-3.909793 m 0.718163,3.909793 -3.885211,0.802902',
      height: 13.9,
      width: 13.7,
      heightElements: [],
      widthElements: []
    },
    'MARKER_ADHOC': {
      d: 'm {mx},{my} m 0.84461,2.64411 c 1.05533,-1.23780996 2.64337,-2.07882 4.29653,-1.97997996 2.05163,0.0805 ' +
        '3.85579,1.15803 5.76082,1.79107 1.06385,0.34139996 2.24454,0.1438 3.18759,-0.43767 0.61743,-0.33642 ' +
        '1.2775,-0.64078 1.7542,-1.17511 0,0.56023 0,1.12046 0,1.6807 -0.98706,0.96237996 -2.29792,1.62393996 ' +
        '-3.6918,1.66181996 -1.24459,0.0927 -2.46671,-0.2491 -3.59505,-0.74812 -1.35789,-0.55965 ' +
        '-2.75133,-1.33436996 -4.27027,-1.18121996 -1.37741,0.14601 -2.41842,1.13685996 -3.44288,1.96782996 z',
      height: 4,
      width: 15,
      heightElements: [],
      widthElements: []
    },
    'TASK_TYPE_SEND': {
      d: 'm {mx},{my} l 0,{e.y1} l {e.x1},0 l 0,-{e.y1} z l {e.x0},{e.y0} l {e.x0},-{e.y0}',
      height: 14,
      width:  21,
      heightElements: [6, 14],
      widthElements: [10.5, 21]
    },
    'TASK_TYPE_SCRIPT': {
      d: 'm {mx},{my} c 9.966553,-6.27276 -8.000926,-7.91932 2.968968,-14.938 l -8.802728,0 ' +
        'c -10.969894,7.01868 6.997585,8.66524 -2.968967,14.938 z ' +
        'm -7,-12 l 5,0 ' +
        'm -4.5,3 l 4.5,0 ' +
        'm -3,3 l 5,0' +
        'm -4,3 l 5,0',
      height: 15,
      width:  12.6,
      heightElements: [6, 14],
      widthElements: [10.5, 21]
    },
    'TASK_TYPE_USER_1': {
      d: 'm {mx},{my} c 0.909,-0.845 1.594,-2.049 1.594,-3.385 0,-2.554 -1.805,-4.62199999 ' +
        '-4.357,-4.62199999 -2.55199998,0 -4.28799998,2.06799999 -4.28799998,4.62199999 0,1.348 ' +
        '0.974,2.562 1.89599998,3.405 -0.52899998,0.187 -5.669,2.097 -5.794,4.7560005 v 6.718 ' +
        'h 17 v -6.718 c 0,-2.2980005 -5.5279996,-4.5950005 -6.0509996,-4.7760005 z' +
        'm -8,6 l 0,5.5 m 11,0 l 0,-5'
    },
    'TASK_TYPE_USER_2': {
      d: 'm {mx},{my} m 2.162,1.009 c 0,2.4470005 -2.158,4.4310005 -4.821,4.4310005 ' +
        '-2.66499998,0 -4.822,-1.981 -4.822,-4.4310005 '
    },
    'TASK_TYPE_USER_3': {
      d: 'm {mx},{my} m -6.9,-3.80 c 0,0 2.25099998,-2.358 4.27399998,-1.177 2.024,1.181 4.221,1.537 ' +
        '4.124,0.965 -0.098,-0.57 -0.117,-3.79099999 -4.191,-4.13599999 -3.57499998,0.001 ' +
        '-4.20799998,3.36699999 -4.20699998,4.34799999 z'
    },
    'TASK_TYPE_MANUAL': {
      d: 'm {mx},{my} c 0.234,-0.01 5.604,0.008 8.029,0.004 0.808,0 1.271,-0.172 1.417,-0.752 0.227,-0.898 ' +
        '-0.334,-1.314 -1.338,-1.316 -2.467,-0.01 -7.886,-0.004 -8.108,-0.004 -0.014,-0.079 0.016,-0.533 0,-0.61 ' +
        '0.195,-0.042 8.507,0.006 9.616,0.002 0.877,-0.007 1.35,-0.438 1.353,-1.208 0.003,-0.768 -0.479,-1.09 ' +
        '-1.35,-1.091 -2.968,-0.002 -9.619,-0.013 -9.619,-0.013 v -0.591 c 0,0 5.052,-0.016 7.225,-0.016 ' +
        '0.888,-0.002 1.354,-0.416 1.351,-1.193 -0.006,-0.761 -0.492,-1.196 -1.361,-1.196 -3.473,-0.005 ' +
        '-10.86,-0.003 -11.0829995,-0.003 -0.022,-0.047 -0.045,-0.094 -0.069,-0.139 0.3939995,-0.319 ' +
        '2.0409995,-1.626 2.4149995,-2.017 0.469,-0.4870005 0.519,-1.1650005 0.162,-1.6040005 -0.414,-0.511 ' +
        '-0.973,-0.5 -1.48,-0.236 -1.4609995,0.764 -6.5999995,3.6430005 -7.7329995,4.2710005 -0.9,0.499 ' +
        '-1.516,1.253 -1.882,2.19 -0.37000002,0.95 -0.17,2.01 -0.166,2.979 0.004,0.718 -0.27300002,1.345 ' +
        '-0.055,2.063 0.629,2.087 2.425,3.312 4.859,3.318 4.6179995,0.014 9.2379995,-0.139 13.8569995,-0.158 ' +
        '0.755,-0.004 1.171,-0.301 1.182,-1.033 0.012,-0.754 -0.423,-0.969 -1.183,-0.973 -1.778,-0.01 ' +
        '-5.824,-0.004 -6.04,-0.004 10e-4,-0.084 0.003,-0.586 10e-4,-0.67 z'
    },
    'TASK_TYPE_INSTANTIATING_SEND': {
      d: 'm {mx},{my} l 0,8.4 l 12.6,0 l 0,-8.4 z l 6.3,3.6 l 6.3,-3.6'
    },
    'TASK_TYPE_SERVICE': {
      d: 'm {mx},{my} v -1.71335 c 0.352326,-0.0705 0.703932,-0.17838 1.047628,-0.32133 ' +
        '0.344416,-0.14465 0.665822,-0.32133 0.966377,-0.52145 l 1.19431,1.18005 1.567487,-1.57688 ' +
        '-1.195028,-1.18014 c 0.403376,-0.61394 0.683079,-1.29908 0.825447,-2.01824 l 1.622133,-0.01 ' +
        'v -2.2196 l -1.636514,0.01 c -0.07333,-0.35153 -0.178319,-0.70024 -0.323564,-1.04372 ' +
        '-0.145244,-0.34406 -0.321407,-0.6644 -0.522735,-0.96217 l 1.131035,-1.13631 -1.583305,-1.56293 ' +
        '-1.129598,1.13589 c -0.614052,-0.40108 -1.302883,-0.68093 -2.022633,-0.82247 l 0.0093,-1.61852 ' +
        'h -2.241173 l 0.0042,1.63124 c -0.353763,0.0736 -0.705369,0.17977 -1.049785,0.32371 -0.344415,0.14437 ' +
        '-0.665102,0.32092 -0.9635006,0.52046 l -1.1698628,-1.15823 -1.5667691,1.5792 1.1684265,1.15669 ' +
        'c -0.4026573,0.61283 -0.68308,1.29797 -0.8247287,2.01713 l -1.6588041,0.003 v 2.22174 ' +
        'l 1.6724648,-0.006 c 0.073327,0.35077 0.1797598,0.70243 0.3242851,1.04472 0.1452428,0.34448 ' +
        '0.3214064,0.6644 0.5227339,0.96066 l -1.1993431,1.19723 1.5840256,1.56011 1.1964668,-1.19348 ' +
        'c 0.6140517,0.40346 1.3028827,0.68232 2.0233517,0.82331 l 7.19e-4,1.69892 h 2.226848 z ' +
        'm 0.221462,-3.9957 c -1.788948,0.7502 -3.8576,-0.0928 -4.6097055,-1.87438 -0.7521065,-1.78321 ' +
        '0.090598,-3.84627 1.8802645,-4.59604 1.78823,-0.74936 3.856881,0.0929 4.608987,1.87437 ' +
        '0.752106,1.78165 -0.0906,3.84612 -1.879546,4.59605 z'
    },
    'TASK_TYPE_SERVICE_FILL': {
      d: 'm {mx},{my} c -1.788948,0.7502 -3.8576,-0.0928 -4.6097055,-1.87438 -0.7521065,-1.78321 ' +
        '0.090598,-3.84627 1.8802645,-4.59604 1.78823,-0.74936 3.856881,0.0929 4.608987,1.87437 ' +
        '0.752106,1.78165 -0.0906,3.84612 -1.879546,4.59605 z'
    },
    'TASK_TYPE_BUSINESS_RULE_HEADER': {
      d: 'm {mx},{my} 0,4 20,0 0,-4 z'
    },
    'TASK_TYPE_BUSINESS_RULE_MAIN': {
      d: 'm {mx},{my} 0,12 20,0 0,-12 z' +
        'm 0,8 l 20,0 ' +
        'm -13,-4 l 0,8'
    },
    'MESSAGE_FLOW_MARKER': {
      d: 'm {mx},{my} m -10.5 ,-7 l 0,14 l 21,0 l 0,-14 z l 10.5,6 l 10.5,-6'
    }
  };

  this.getRawPath = function getRawPath(pathId) {
    return this.pathMap[pathId].d;
  };

  /**
   * Scales the path to the given height and width.
   * <h1>Use case</h1>
   * <p>Use case is to scale the content of elements (event, gateways) based
   * on the element bounding box's size.
   * </p>
   * <h1>Why not transform</h1>
   * <p>Scaling a path with transform() will also scale the stroke and IE does not support
   * the option 'non-scaling-stroke' to prevent this.
   * Also there are use cases where only some parts of a path should be
   * scaled.</p>
   *
   * @param {String} pathId The ID of the path.
   * @param {Object} param <p>
   *   Example param object scales the path to 60% size of the container (data.width, data.height).
   *   <pre>
   *   {
   *     xScaleFactor: 0.6,
   *     yScaleFactor:0.6,
   *     containerWidth: data.width,
   *     containerHeight: data.height,
   *     position: {
   *       mx: 0.46,
   *       my: 0.2,
   *     }
   *   }
   *   </pre>
   *   <ul>
   *    <li>targetpathwidth = xScaleFactor * containerWidth</li>
   *    <li>targetpathheight = yScaleFactor * containerHeight</li>
   *    <li>Position is used to set the starting coordinate of the path. M is computed:
    *    <ul>
    *      <li>position.x * containerWidth</li>
    *      <li>position.y * containerHeight</li>
    *    </ul>
    *    Center of the container <pre> position: {
   *       mx: 0.5,
   *       my: 0.5,
   *     }</pre>
   *     Upper left corner of the container
   *     <pre> position: {
   *       mx: 0.0,
   *       my: 0.0,
   *     }</pre>
   *    </li>
   *   </ul>
   * </p>
   *
   */
  this.getScaledPath = function getScaledPath(pathId, param) {
    var rawPath = this.pathMap[pathId];

    // positioning
    // compute the start point of the path
    var mx, my;

    if(!!param.abspos) {
      mx = param.abspos.x;
      my = param.abspos.y;
    } else {
      mx = param.containerWidth * param.position.mx;
      my = param.containerHeight * param.position.my;
    }

    var coordinates = {}; //map for the scaled coordinates
    if(param.position) {

      // path
      var heightRatio = (param.containerHeight / rawPath.height) * param.yScaleFactor;
      var widthRatio = (param.containerWidth / rawPath.width) * param.xScaleFactor;


      //Apply height ratio
      for (var heightIndex = 0; heightIndex < rawPath.heightElements.length; heightIndex++) {
        coordinates['y' + heightIndex] = rawPath.heightElements[heightIndex] * heightRatio;
      }

      //Apply width ratio
      for (var widthIndex = 0; widthIndex < rawPath.widthElements.length; widthIndex++) {
        coordinates['x' + widthIndex] = rawPath.widthElements[widthIndex] * widthRatio;
      }
    }

    //Apply value to raw path
    var path = Snap.format(
      rawPath.d, {
        mx: mx,
        my: my,
        e: coordinates
      }
    );
    return path;
  };
}


PathMap.$inject = [ 'snap' ];

module.exports = PathMap;

},{}],6:[function(_dereq_,module,exports){
module.exports = {
  renderer: [ 'type', _dereq_(4) ],
  pathMap: [ 'type', _dereq_(5) ]
};
},{}],7:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * A provider for BPMN 2.0 elements context pad
 */
function ContextPadProvider(contextPad, directEditing, modeling, selection, elementFactory, connect, create) {

  contextPad.registerProvider(this);

  this._directEditing = directEditing;

  this._modeling = modeling;
  this._selection = selection;

  this._elementFactory = elementFactory;
  this._connect = connect;
  this._create = create;
}

ContextPadProvider.$inject = [
  'contextPad',
  'directEditing',
  'modeling',
  'selection',
  'elementFactory',
  'connect',
  'create'
];

ContextPadProvider.prototype.getContextPadEntries = function(element) {

  var directEditing = this._directEditing,
      modeling = this._modeling,
      selection = this._selection,
      elementFactory = this._elementFactory,
      connect = this._connect,
      create = this._create;

  var actions = {};

  if (element.type === 'label') {
    return actions;
  }

  var bpmnElement = element.businessObject;

  function startConnect(event, element, autoActivate) {
    connect.start(event, element, autoActivate);
  }

  function appendAction(type, className) {

    function appendListener(event, element) {
      var shape = elementFactory.createShape({ type: type });
      create.start(event, shape, element);
    }

    return {
      group: 'model',
      className: className,
      action: {
        dragstart: appendListener,
        click: appendListener
      }
    };
  }

  if (bpmnElement.$instanceOf('bpmn:FlowNode')) {

    if (!bpmnElement.$instanceOf('bpmn:EndEvent')) {

      _.extend(actions, {
        'append.end-event': appendAction('bpmn:EndEvent', 'icon-end-event'),
        'append.gateway': appendAction('bpmn:ExclusiveGateway', 'icon-gateway'),
        'append.append-task': appendAction('bpmn:Task', 'icon-task'),
        'append.intermediate-event': appendAction('bpmn:IntermediateThrowEvent', 'icon-intermediate-event'),
        'connect': {
          group: 'connect',
          className: 'icon-connection',
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        }
      });
    }

    _.extend(actions, {
      'append.text-annotation': appendAction('bpmn:TextAnnotation', 'icon-text-annotation')
    });
  }

  function removeElement(e) {
    if (element.waypoints) {
      modeling.removeConnection(element);
    } else {
      modeling.removeShape(element);
    }
  }

  _.extend(actions, {
    'delete': {
      group: 'edit',
      className: 'icon-trash',
      action: {
        click: removeElement,
        dragstart: removeElement
      }
    }
  });

  return actions;
};


module.exports = ContextPadProvider;

},{}],8:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(57),
    _dereq_(85),
    _dereq_(133),
    _dereq_(83),
    _dereq_(87),
    _dereq_(23)
  ],
  __init__: [ 'contextPadProvider' ],
  contextPadProvider: [ 'type', _dereq_(7) ]
};
},{}],9:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var UpdateLabelHandler = _dereq_(11);

var LabelUtil = _dereq_(10),
    DiUtil = _dereq_(33);


var PADDING = 4;

var MIN_BOUNDS = {
  width: 150,
  height: 50
};


function LabelEditingProvider(eventBus, canvas, directEditing, commandStack, injector) {

  directEditing.registerProvider(this);
  commandStack.registerHandler('element.updateLabel', UpdateLabelHandler);

  // listen to dblclick on non-root elements
  eventBus.on('element.dblclick', function(event) {
    directEditing.activate(event.element);
  });

  // complete on followup canvas operation
  eventBus.on([ 'element.mousedown', 'drag.activate', 'canvas.viewbox.changed' ], function(event) {
    directEditing.complete();
  });

  // cancel on command stack changes
  eventBus.on([ 'commandStack.changed' ], function() {
    directEditing.cancel();
  });


  // activate direct editing for activities and text annotations


  if ('ontouchstart' in document.documentElement) {
    // we deactivate automatic label editing on mobile devices
    // as it breaks the user interaction workflow

    // TODO(nre): we should temporarily focus the edited element here
    // and release the focused viewport after the direct edit operation is finished
  } else {
    eventBus.on('create.end', 500, function(e) {

      var element = e.shape,
          businessObject = element.businessObject;

      if (businessObject.$instanceOf('bpmn:Task') ||
          businessObject.$instanceOf('bpmn:TextAnnotation') ||
          (businessObject.$instanceOf('bpmn:SubProcess') && !businessObject.di.isExpanded)) {

        directEditing.activate(element);
      }
    });
  }

  this._canvas = canvas;
  this._commandStack = commandStack;
}

LabelEditingProvider.$inject = [ 'eventBus', 'canvas', 'directEditing', 'commandStack', 'injector' ];

module.exports = LabelEditingProvider;


LabelEditingProvider.prototype.activate = function(element) {

  var semantic = element.businessObject,
      di = semantic.di;

  var text = LabelUtil.getLabel(element);

  if (text === undefined) {
    return;
  }

  var bbox = this.getEditingBBox(element);

  // adjust for expanded pools / lanes
  if ((semantic.$instanceOf('bpmn:Participant') && DiUtil.isExpandedPool(semantic)) ||
       semantic.$instanceOf('bpmn:Lane')) {

    bbox.width = MIN_BOUNDS.width;
    bbox.height = MIN_BOUNDS.height;

    bbox.x = bbox.x + 10 - bbox.width / 2;
    bbox.y = bbox.mid.y - bbox.height / 2;
  }

  // adjust for sub processes
  if (semantic.$instanceOf('bpmn:SubProcess') && DiUtil.isExpanded(semantic, di)) {

    bbox.height = MIN_BOUNDS.height;

    bbox.x = bbox.mid.x - bbox.width / 2;
    bbox.y = bbox.y + 10 - bbox.height / 2;
  }

  return { bounds: bbox, text: text };
};


LabelEditingProvider.prototype.getEditingBBox = function(element, maxBounds) {

  var target = element.label || element;

  var bbox = this._canvas.getAbsoluteBBox(target);

  var mid = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2
  };

  // external label
  if (target.labelTarget) {
    bbox.width = Math.max(bbox.width, MIN_BOUNDS.width);
    bbox.height = Math.max(bbox.height, MIN_BOUNDS.height);

    bbox.x = mid.x - bbox.width / 2;
  }

  bbox.mid = mid;

  return bbox;
};


LabelEditingProvider.prototype.update = function(element, newLabel) {
  this._commandStack.execute('element.updateLabel', {
    element: element,
    newLabel: newLabel
  });
};
},{}],10:[function(_dereq_,module,exports){

function getLabelAttr(semantic) {
  if (semantic.$instanceOf('bpmn:FlowElement') ||
      semantic.$instanceOf('bpmn:Participant') ||
      semantic.$instanceOf('bpmn:Lane') ||
      semantic.$instanceOf('bpmn:SequenceFlow') ||
      semantic.$instanceOf('bpmn:MessageFlow')) {
    return 'name';
  }

  if (semantic.$instanceOf('bpmn:TextAnnotation')) {
    return 'text';
  }
}

module.exports.getLabel = function(element) {
  var semantic = element.businessObject,
      attr = getLabelAttr(semantic);

  if (attr) {
    return semantic[attr] || '';
  }
};


module.exports.setLabel = function(element, text) {
  var semantic = element.businessObject,
      attr = getLabelAttr(semantic);

  if (attr) {
    semantic[attr] = text;
  }

  var label = element.label || element;

  // show label
  label.hidden = false;

  return label;
};
},{}],11:[function(_dereq_,module,exports){
'use strict';

var LabelUtil = _dereq_(10);


/**
 * A handler that updates the text of a BPMN element.
 *
 * @param {EventBus} eventBus
 */
function UpdateTextHandler(eventBus) {

  function setText(element, text) {
    var label = LabelUtil.setLabel(element, text);

    eventBus.fire('element.changed', { element: label });
  }

  function execute(ctx) {
    ctx.oldLabel = LabelUtil.getLabel(ctx.element);
    return setText(ctx.element, ctx.newLabel);
  }

  function revert(ctx) {
    return setText(ctx.element, ctx.oldLabel);
  }


  function canExecute(ctx) {
    return true;
  }

  // API

  this.execute = execute;
  this.revert = revert;

  this.canExecute = canExecute;
}


UpdateTextHandler.$inject = [ 'eventBus' ];

module.exports = UpdateTextHandler;
},{}],12:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(63),
    _dereq_(81),
    _dereq_(57)
  ],
  __init__: [ 'labelEditingProvider' ],
  labelEditingProvider: [ 'type', _dereq_(9) ]
};
},{}],13:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


function BpmnFactory(moddle) {
  this._model = moddle;
}

BpmnFactory.$inject = [ 'moddle' ];


BpmnFactory.prototype._needsId = function(element) {
  return element.$instanceOf('bpmn:RootElement') ||
         element.$instanceOf('bpmn:FlowElement') ||
         element.$instanceOf('bpmn:Artifact') ||
         element.$instanceOf('bpmndi:BPMNShape') ||
         element.$instanceOf('bpmndi:BPMNEdge') ||
         element.$instanceOf('bpmndi:BPMNDiagram') ||
         element.$instanceOf('bpmndi:BPMNPlane');
};

BpmnFactory.prototype._ensureId = function(element) {

  // generate semantic ids for elements
  // bpmn:SequenceFlow -> SequenceFlow_ID
  var prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';

  if (!element.id && this._needsId(element)) {
    element.id = this._model.ids.nextPrefixed(prefix, element);
  }
};


BpmnFactory.prototype.create = function(type, attrs) {
  var element = this._model.create(type, attrs || {});

  this._ensureId(element);

  return element;
};


BpmnFactory.prototype.createDiLabel = function() {
  return this.create('bpmndi:BPMNLabel', {
    bounds: this.createDiBounds()
  });
};


BpmnFactory.prototype.createDiShape = function(semantic, bounds, attrs) {

  return this.create('bpmndi:BPMNShape', _.extend({
    bpmnElement: semantic,
    bounds: this.createDiBounds(bounds)
  }, attrs));
};


BpmnFactory.prototype.createDiBounds = function(bounds) {
  return this.create('dc:Bounds', bounds);
};


BpmnFactory.prototype.createDiWaypoints = function(waypoints) {
  return _.map(waypoints, function(pos) {
    return this.createDiWaypoint(pos);
  }, this);
};

BpmnFactory.prototype.createDiWaypoint = function(point) {
  return this.create('dc:Point', _.pick(point, [ 'x', 'y' ]));
};


BpmnFactory.prototype.createDiEdge = function(semantic, waypoints, attrs) {
  return this.create('bpmndi:BPMNEdge', _.extend({
    bpmnElement: semantic
  }, attrs));
};


module.exports = BpmnFactory;

},{}],14:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Collections = _dereq_(148);

var Model = _dereq_(142);


/**
 * A handler responsible for updating the underlying BPMN 2.0 XML + DI
 * once changes on the diagram happen
 */
function BpmnUpdater(eventBus, bpmnFactory, connectionDocking) {

  this._eventBus = eventBus;
  this._bpmnFactory = bpmnFactory;

  var self = this;



  ////// connection cropping /////////////////////////

  // crop connection ends during create/update
  function cropConnection(e) {
    var context = e.context,
        connection;

    if (!context.cropped) {
      connection = context.connection;
      connection.waypoints = connectionDocking.getCroppedWaypoints(connection);
      context.cropped = true;
    }
  }

  this.executed([
    'connection.layout',
    'connection.create',
    'connection.reconnectEnd',
    'connection.reconnectStart'
  ], cropConnection);

  this.reverted([ 'connection.layout' ], function(e) {
    delete e.context.cropped;
  });



  ////// BPMN + DI update /////////////////////////


  // update parent
  function updateParent(e) {
    self.updateParent(e.context.shape || e.context.connection);
  }

  this.executed([ 'shape.move',
                  'shape.create',
                  'shape.delete',
                  'connection.create',
                  'connection.move',
                  'connection.delete' ], updateParent);
  this.reverted([ 'shape.move',
                  'shape.create',
                  'shape.delete',
                  'connection.create',
                  'connection.move',
                  'connection.delete' ], updateParent);


  // update bounds
  function updateBounds(e) {
    self.updateBounds(e.context.shape);
  }

  this.executed([ 'shape.move', 'shape.create', 'shape.resize' ], updateBounds);
  this.reverted([ 'shape.move', 'shape.create', 'shape.resize' ], updateBounds);


  // attach / detach connection
  function updateConnection(e) {
    self.updateConnection(e.context.connection);
  }

  this.executed([
    'connection.create',
    'connection.move',
    'connection.delete',
    'connection.reconnectEnd',
    'connection.reconnectStart'
  ], updateConnection);

  this.reverted([
    'connection.create',
    'connection.move',
    'connection.delete',
    'connection.reconnectEnd',
    'connection.reconnectStart'
  ], updateConnection);


  // update waypoints
  function updateConnectionWaypoints(e) {
    self.updateConnectionWaypoints(e.context.connection);
  }

  this.executed([
    'connection.layout',
    'connection.move',
    'connection.updateWaypoints',
    'connection.reconnectEnd',
    'connection.reconnectStart'
  ], updateConnectionWaypoints);

  this.reverted([
    'connection.layout',
    'connection.move',
    'connection.updateWaypoints',
    'connection.reconnectEnd',
    'connection.reconnectStart'
  ], updateConnectionWaypoints);
}

module.exports = BpmnUpdater;

BpmnUpdater.$inject = [ 'eventBus', 'bpmnFactory', 'connectionDocking'];


/////// implementation //////////////////////////////////


BpmnUpdater.prototype.updateParent = function(element) {

  // do not update BPMN 2.0 label parent
  if (element instanceof Model.Label) {
    return;
  }

  var parentShape = element.parent;

  var businessObject = element.businessObject,
      parentBusinessObject = parentShape && parentShape.businessObject,
      parentDi = parentBusinessObject && parentBusinessObject.di;

  this.updateSemanticParent(businessObject, parentBusinessObject);

  this.updateDiParent(businessObject.di, parentDi);
};


BpmnUpdater.prototype.updateBounds = function(shape) {

  var di = shape.businessObject.di;

  var bounds = (shape instanceof Model.Label) ? this._getLabel(di).bounds : di.bounds;

  _.extend(bounds, {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height
  });
};


BpmnUpdater.prototype.updateDiParent = function(di, parentDi) {

  if (parentDi && !parentDi.$instanceOf('bpmndi:BPMNPlane')) {
    parentDi = parentDi.$parent;
  }

  if (di.$parent === parentDi) {
    return;
  }

  var planeElements = (parentDi || di.$parent).get('planeElement');

  if (parentDi) {
    planeElements.push(di);
    di.$parent = parentDi;
  } else {
    Collections.remove(planeElements, di);
    di.$parent = null;
  }
};


BpmnUpdater.prototype.updateSemanticParent = function(businessObject, newParent) {

  var containment;

  if (businessObject.$parent === newParent) {
    return;
  }

  if (businessObject.$instanceOf('bpmn:FlowElement')) {

    if (businessObject.$parent === newParent) {
      return;
    }

    if (newParent && newParent.$instanceOf('bpmn:Participant')) {
      newParent = newParent.processRef;
    }

    containment = 'flowElements';
  } else

  if (businessObject.$instanceOf('bpmn:Artifact')) {

    while (newParent &&
           !newParent.$instanceOf('bpmn:Process') &&
           !newParent.$instanceOf('bpmn:SubProcess') &&
           !newParent.$instanceOf('bpmn:Collaboration')) {

      if (newParent.$instanceOf('bpmn:Participant')) {
        newParent = newParent.processRef;
        break;
      } else {
        newParent = newParent.$parent;
      }
    }

    containment = 'artifacts';
  }

  if (!containment) {
    throw new Error('no parent for ', businessObject, newParent);
  }

  var children;

  if (businessObject.$parent) {
    // remove from old parent
    children = businessObject.$parent.get(containment);
    Collections.remove(children, businessObject);
  }

  if (!newParent) {
    businessObject.$parent = null;
  } else {
    // add to new parent
    children = newParent.get(containment);
    children.push(businessObject);
    businessObject.$parent = newParent;
  }
};


BpmnUpdater.prototype.updateConnectionWaypoints = function(connection) {

  connection.businessObject.di.set('waypoint', this._bpmnFactory.createDiWaypoints(connection.waypoints));
};


BpmnUpdater.prototype.updateConnection = function(connection) {

  var businessObject = connection.businessObject,
      newSource = connection.source && connection.source.businessObject,
      newTarget = connection.target && connection.target.businessObject;

  var inverseSet = businessObject.$instanceOf('bpmn:SequenceFlow');

  if (businessObject.sourceRef !== newSource) {
    if (inverseSet) {
      Collections.remove(businessObject.sourceRef && businessObject.sourceRef.get('outgoing'), businessObject);

      if (newSource) {
        newSource.get('outgoing').push(businessObject);
      }
    }

    businessObject.sourceRef = newSource;
  }
  if (businessObject.targetRef !== newTarget) {
    if (inverseSet) {
      Collections.remove(businessObject.targetRef && businessObject.targetRef.get('incoming'), businessObject);

      if (newTarget) {
        newTarget.get('incoming').push(businessObject);
      }
    }

    businessObject.targetRef = newTarget;
  }

  businessObject.di.set('waypoint', this._bpmnFactory.createDiWaypoints(connection.waypoints));
};


/////// helpers /////////////////////////////////////////

BpmnUpdater.prototype._getLabel = function(di) {
  if (!di.label) {
    di.label = this._bpmnFactory.createDiLabel();
  }

  return di.label;
};

BpmnUpdater.prototype.pre = function(commands, callback) {
  this.on(commands, 'preExecute', callback);
};

BpmnUpdater.prototype.executed = function(commands, callback) {
  this.on(commands, 'executed', callback);
};

BpmnUpdater.prototype.reverted = function(commands, callback) {
  this.on(commands, 'reverted', callback);
};

BpmnUpdater.prototype.on = function(commands, suffix, callback) {
  commands = _.isArray(commands) ? commands : [ commands ];

  _.forEach(commands, function(c) {
    this._eventBus.on('commandStack.' + c + '.' + suffix, callback);
  }, this);
};

},{}],15:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var BaseElementFactory = _dereq_(65);

var LabelUtil = _dereq_(34);


/**
 * A bpmn-aware factory for diagram-js shapes
 */
function ElementFactory(bpmnFactory) {
  BaseElementFactory.call(this);

  this._bpmnFactory = bpmnFactory;
}

ElementFactory.prototype = Object.create(BaseElementFactory.prototype);

ElementFactory.$inject = [ 'bpmnFactory' ];

module.exports = ElementFactory;

ElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;

ElementFactory.prototype.create = function(elementType, attrs) {

  // no special magic for labels,
  // we assume their businessObjects have already been created
  // and wired via attrs
  if (elementType === 'label') {
    return this.baseCreate(elementType, _.extend({ type: 'label' }, LabelUtil.DEFAULT_LABEL_SIZE, attrs));
  }

  attrs = attrs || {};

  var businessObject = attrs.businessObject,
      size;

  if (!businessObject) {
    if (!attrs.type) {
      throw new Error('no shape type specified');
    }

    businessObject = this._bpmnFactory.create(attrs.type);
  }

  if (!businessObject.di) {
    if (elementType === 'connection') {
      businessObject.di = this._bpmnFactory.createDiEdge(businessObject, [], {
        id: businessObject.id + '_di'
      });
    } else {
      businessObject.di = this._bpmnFactory.createDiShape(businessObject, {}, {
        id: businessObject.id + '_di'
      });
    }
  }

 if (!!attrs.isExpanded) {
   businessObject.di.isExpanded = attrs.isExpanded;
 }

 size = this._getDefaultSize(businessObject);

  attrs = _.extend({
    businessObject: businessObject,
    id: businessObject.id
  }, size, attrs);

  return this.baseCreate(elementType, attrs);
};


ElementFactory.prototype._getDefaultSize = function(semantic) {

  if (semantic.$instanceOf('bpmn:SubProcess')) {
    var isExpanded = semantic.di.isExpanded === true;

    if (isExpanded) {
      return { width: 350, height: 200 };
    } else {
      return { width: 100, height: 80 };
    }
  }

  if (semantic.$instanceOf('bpmn:Task')) {
    return { width: 100, height: 80 };
  }

  if (semantic.$instanceOf('bpmn:Gateway')) {
    return { width: 50, height: 50 };
  }

  if (semantic.$instanceOf('bpmn:Event')) {
    return { width: 36, height: 36 };
  }

  return { width: 100, height: 80 };
};

},{}],16:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var LabelUtil = _dereq_(34);

var hasExternalLabel = LabelUtil.hasExternalLabel,
    getExternalLabelMid = LabelUtil.getExternalLabelMid;


function LabelSupport(eventBus, modeling, bpmnFactory) {

  // create external labels on shape creation

  eventBus.on([
    'commandStack.shape.create.postExecute',
    'commandStack.connection.create.postExecute'
  ], function(e) {
    var context = e.context;

    var element = context.shape || context.connection,
        businessObject = element.businessObject;

    var position;

    if (hasExternalLabel(businessObject)) {
      position = getExternalLabelMid(element);
      modeling.createLabel(element, position, {
        id: businessObject.id + '_label',
        businessObject: businessObject
      });
    }
  });


  // indicate label is dragged during move

  // we need to add labels to the list of selected
  // shapes before the visuals get drawn.
  //
  // Hence this awesome magic number.
  //
  eventBus.on('shape.move.start', function(e) {

    var context = e.context,
        shapes = context.shapes;

    var labels = [];

    _.forEach(shapes, function(element) {
      var label = element.label;

      if (label && !label.hidden && context.shapes.indexOf(label) === -1) {
        labels.push(label);
      }
    });

    _.forEach(labels, function(label) {
      shapes.push(label);
    });
  });


  // move labels with shapes

  eventBus.on([
    'commandStack.shapes.move.postExecute'
  ], function(e) {

    var context = e.context,
        closure = context.closure,
        enclosedElements = closure.enclosedElements;

    // ensure we move all labels with their respective elements
    // if they have not been moved already

    _.forEach(enclosedElements, function(e) {
      if (e.label && !enclosedElements[e.label.id]) {
        modeling.moveShape(e.label, context.delta, e.parent);
      }
    });
  });


  // update di information on label movement and creation

  eventBus.on([
    'commandStack.label.create.executed',
    'commandStack.shape.moved.executed'
  ], function(e) {

    var element = e.context.shape,
        businessObject = element.businessObject,
        di = businessObject.di;

    // we want to trigger on real labels only
    if (!element.labelTarget) {
      return;
    }

    if (!di.label) {
      di.label = bpmnFactory.create('bpmndi:BPMNLabel', {
        bounds: bpmnFactory.create('dc:Bounds')
      });
    }

    _.extend(di.label.bounds, {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    });
  });
}

LabelSupport.$inject = [ 'eventBus', 'modeling', 'bpmnFactory' ];

module.exports = LabelSupport;

},{}],17:[function(_dereq_,module,exports){
'use strict';

var BaseLayouter = _dereq_(96),
    LayoutUtil = _dereq_(141),
    ManhattanLayout = _dereq_(140);


function Layouter() {}

Layouter.prototype = Object.create(BaseLayouter.prototype);

module.exports = Layouter;


Layouter.prototype.getConnectionWaypoints = function(connection) {
  var source = connection.source,
      start = LayoutUtil.getMidPoint(source),
      target = connection.target,
      end = LayoutUtil.getMidPoint(target);

  var bo = connection.businessObject;

  // manhattan layout sequence / message flows
  if (bo.$instanceOf('bpmn:SequenceFlow') ||
      bo.$instanceOf('bpmn:MessageFlow')) {

    var waypoints = ManhattanLayout.repairConnection(source, target, start, end, connection.waypoints);

    if (waypoints) {
      return waypoints;
    }
  }

  return [ start, end ];
};
},{}],18:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var BaseModeling = _dereq_(97);

var UpdatePropertiesHandler = _dereq_(22);

/**
 * BPMN 2.0 modeling features activator
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 */
function Modeling(eventBus, elementFactory, commandStack) {
  BaseModeling.call(this, eventBus, elementFactory, commandStack);
}

Modeling.prototype = Object.create(BaseModeling.prototype);

Modeling.$inject = [ 'eventBus', 'elementFactory', 'commandStack' ];

module.exports = Modeling;

Modeling.prototype.getHandlers = function() {
  var handlers = BaseModeling.prototype.getHandlers.call(this);

  handlers['element.updateProperties'] = UpdatePropertiesHandler;

  return handlers;
};


Modeling.prototype.updateLabel = function(element, newLabel) {
  this._commandStack.execute('element.updateLabel', {
    element: element,
    newLabel: newLabel
  });
};


Modeling.prototype.connect = function(source, target, attrs) {

  var sourceBo = source.businessObject,
      targetBo = target.businessObject;

  if (!attrs) {
    if (sourceBo.$instanceOf('bpmn:FlowNode') &&
        targetBo.$instanceOf('bpmn:FlowNode') &&
       !sourceBo.$instanceOf('bpmn:EndEvent') &&
       !targetBo.$instanceOf('bpmn:StartEvent')) {

      attrs = {
        type: 'bpmn:SequenceFlow'
      };
    } else {
      attrs = {
        type: 'bpmn:Association'
      };
    }
  }

  return this.createConnection(source, target, attrs, source.parent);
};


Modeling.prototype.updateProperties = function(element, properties) {
  this._commandStack.execute('element.updateProperties', {
    element: element,
    properties: properties
  });
};
},{}],19:[function(_dereq_,module,exports){


function AppendBehavior(eventBus, elementFactory) {

  // assign the correct connection
  // when appending a shape to another shape

  eventBus.on('commandStack.shape.append.preExecute', function(event) {

    var context = event.context,
        source = context.source,
        shape = context.shape,
        parent = context.parent || source.parent;

    if (!context.position) {

      if (shape.businessObject.$instanceOf('bpmn:TextAnnotation')) {
        context.position = {
          x: source.x + source.width / 2 + 75,
          y: source.y - (50) - shape.height / 2
        };
      } else {
        context.position = {
          x: source.x + source.width + 80 + shape.width / 2,
          y: source.y + source.height / 2
        };
      }
    }

    if (!context.connection) {
      var connectionAttrs;

      // connect flow nodes in the same container
      if (shape.businessObject.$instanceOf('bpmn:FlowNode') && parent.children.indexOf(source) !== -1) {
        connectionAttrs = { type: 'bpmn:SequenceFlow' };
      } else {
        // association always works
        connectionAttrs = { type: 'bpmn:Association' };
      }

      context.connection = elementFactory.create('connection', connectionAttrs);
    }
  });
}


AppendBehavior.$inject = [ 'eventBus', 'elementFactory' ];

module.exports = AppendBehavior;
},{}],20:[function(_dereq_,module,exports){
var _ = (window._);


function DropBehavior(eventBus, modeling) {

  // sequence flow handling

  eventBus.on([
    'commandStack.shapes.move.postExecute'
  ], function(e) {

    var context = e.context,
        closure = context.closure,
        allConnections = closure.allConnections,
        allShapes = closure.allShapes;

    _.forEach(allConnections, function(c) {

      // remove sequence flows having source / target on different parents
      if (c.businessObject.$instanceOf('bpmn:SequenceFlow') && c.source.parent !== c.target.parent) {
        modeling.removeConnection(c);
      }
    });
  });

}

DropBehavior.$inject = [ 'eventBus', 'modeling' ];

module.exports = DropBehavior;
},{}],21:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'dropBehavior', 'appendBehavior' ],
  dropBehavior: [ 'type', _dereq_(20) ],
  appendBehavior: [ 'type', _dereq_(19) ]
};
},{}],22:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var DEFAULT_FLOW = 'default',
    NAME = 'name';

/**
 * A handler that implements a BPMN 2.0 property update.
 *
 * This should be used to set simple properties on elements with
 * an underlying BPMN business object.
 *
 * Use respective diagram-js provided handlers if you would
 * like to perform automated modeling.
 */
function UpdatePropertiesHandler(elementRegistry) {
  this._elementRegistry = elementRegistry;
}

UpdatePropertiesHandler.$inject = [ 'elementRegistry' ];

module.exports = UpdatePropertiesHandler;


////// api /////////////////////////////////////////////

/**
 * Updates a BPMN element with a list of new properties
 *
 * @param {Object} context
 * @param {djs.model.Base} context.element the element to update
 * @param {Object} context.properties a list of properties to set on the element's
 *                                    businessObject (the BPMN model element)
 *
 * @return {Array<djs.mode.Base>} the updated element
 */
UpdatePropertiesHandler.prototype.execute = function(context) {

  var element = context.element,
      changed = [ element ];

  if (!element) {
    throw new Error('element required');
  }

  var elementRegistry = this._elementRegistry;

  var businessObject = element.businessObject,
      properties = context.properties,
      oldProperties = context.oldProperties || _.pick(businessObject, _.keys(properties));

  // correctly indicate visual changes on default flow updates
  if (DEFAULT_FLOW in properties) {

    if (properties[DEFAULT_FLOW]) {
      changed.push(elementRegistry.get(properties[DEFAULT_FLOW].id));
    }

    if (businessObject[DEFAULT_FLOW]) {
      changed.push(elementRegistry.get(businessObject[DEFAULT_FLOW].id));
    }
  }

  if (NAME in properties && element.label) {
    changed.push(element.label);
  }

  // update properties
  _.assign(businessObject, properties);


  // store old values
  context.oldProperties = oldProperties;
  context.changed = changed;

  // indicate changed on objects affected by the update
  return changed;
};

/**
 * Reverts the update on a BPMN elements properties.
 *
 * @param  {Object} context
 *
 * @return {djs.mode.Base} the updated element
 */
UpdatePropertiesHandler.prototype.revert = function(context) {

  var element = context.element,
      businessObject = element.businessObject;

  _.assign(businessObject, context.oldProperties);

  return context.changed;
};
},{}],23:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'modeling', 'bpmnUpdater', 'labelSupport' ],
  __depends__: [
    _dereq_(12),
    _dereq_(25),
    _dereq_(21),
    _dereq_(63),
    _dereq_(81)
  ],
  bpmnFactory: [ 'type', _dereq_(13) ],
  bpmnUpdater: [ 'type', _dereq_(14) ],
  elementFactory: [ 'type', _dereq_(15) ],
  modeling: [ 'type', _dereq_(18) ],
  labelSupport: [ 'type', _dereq_(16) ],
  layouter: [ 'type', _dereq_(17) ],
  connectionDocking: [ 'type', _dereq_(139) ]
};

},{}],24:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var RuleProvider = _dereq_(127);

function ModelingRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

ModelingRules.$inject = [ 'eventBus' ];

module.exports = ModelingRules;

ModelingRules.prototype = Object.create(RuleProvider.prototype);


ModelingRules.prototype.init = function() {

  // rules

  function canConnect(source, target, connection) {

    if (!source || source.labelTarget || !target || target.labelTarget) {
      return null;
    }

    var sourceBo = source.businessObject,
        targetBo = target.businessObject,
        connectionBo = connection && connection.businessObject;

    if (sourceBo.$parent !== targetBo.$parent) {
      return false;
    }

    if (connectionBo && connectionBo.$instanceOf('bpmn:SequenceFlow')) {
      if (!sourceBo.$instanceOf('bpmn:FlowNode') ||
          !targetBo.$instanceOf('bpmn:FlowNode') ||
          sourceBo.$instanceOf('bpmn:EndEvent') ||
          targetBo.$instanceOf('bpmn:StartEvent')) {
        return false;
      }
    }

    return (sourceBo.$instanceOf('bpmn:FlowNode') ||
            sourceBo.$instanceOf('bpmn:TextAnnotation')) &&
           (targetBo.$instanceOf('bpmn:FlowNode') ||
            targetBo.$instanceOf('bpmn:TextAnnotation'));
  }

  this.addRule('connection.create', function(context) {
    var source = context.source,
        target = context.target;

    return canConnect(source, target);
  });

  this.addRule('connection.reconnectStart', function(context) {

    var connection = context.connection,
        source = context.hover,
        target = connection.target;

    return canConnect(source, target, connection);
  });

  this.addRule('connection.reconnectEnd', function(context) {

    var connection = context.connection,
        source = connection.source,
        target = context.hover;

    return canConnect(source, target, connection);
  });

  this.addRule('connection.updateWaypoints', function(context) {
    // OK! but visually ignore
    return null;
  });

  this.addRule('shape.resize', function(context) {

    var shape = context.shape,
        newBounds = context.newBounds,
        bo = shape.businessObject;

    if (!bo.$instanceOf('bpmn:SubProcess') || !bo.di.isExpanded) {
      return false;
    }

    if (newBounds) {
      if (newBounds.width < 100 || newBounds.height < 80) {
        return false;
      }
    }
  });

  /**
   * Can an element be dropped into the target element
   *
   * @return {Boolean}
   */
  function canDrop(businessObject, targetBusinessObject, targetDi) {

    if (businessObject.$instanceOf('bpmn:FlowElement') &&
        targetBusinessObject.$instanceOf('bpmn:FlowElementsContainer')) {

      // may not drop into collapsed sub processes
      if (targetDi.isExpanded === false) {
        return false;
      }

      return true;
    }

    if (businessObject.$instanceOf('bpmn:TextAnnotation') &&
        targetBusinessObject.$instanceOf('bpmn:FlowElementsContainer')) {

      return true;
    }

    return false;
  }

  this.addRule('shapes.move', function(context) {

    var target = context.newParent,
        shapes = context.shapes;

    // only move if they have the same parent
    var sameParent = _.size(_.groupBy(shapes, function(s) { return s.parent && s.parent.id; })) === 1;

    if (!sameParent) {
      return false;
    }

    if (!target) {
      return true;
    }

    var targetBusinessObject = target.businessObject,
        targetDi = targetBusinessObject.di;

    return shapes.every(function(s) {
      return canDrop(s.businessObject, targetBusinessObject, targetDi);
    });
  });

  this.addRule([ 'shape.create', 'shape.append' ], function(context) {
    var target = context.parent,
        shape = context.shape,
        source = context.source;

    // ensure we do not drop the element
    // into source
    var t = target;
    while (t) {
      if (t === source) {
        return false;
      }

      t = t.parent;
    }

    if (!target) {
      return false;
    }

    if (target.labelTarget) {
      return null;
    }

    return canDrop(shape.businessObject, target.businessObject, target.businessObject.di);
  });

};
},{}],25:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'modelingRules' ],
  modelingRules: [ 'type', _dereq_(24) ]
};

},{}],26:[function(_dereq_,module,exports){
var _ = (window._);


/**
 * A palette provider for BPMN 2.0 elements.
 */
function PaletteProvider(palette, create, elementFactory) {

  this._create = create;
  this._elementFactory = elementFactory;

  palette.registerProvider(this);
}

module.exports = PaletteProvider;

PaletteProvider.$inject = [ 'palette', 'create', 'elementFactory' ];


PaletteProvider.prototype.getPaletteEntries = function(element) {

  function createAction(type, group, className, title, options) {

    function createListener(event) {
      var shape = elementFactory.createShape(_.extend({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    return {
      group: group,
      className: className,
      title: title || 'Create ' + type,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  var actions  = {},
      create = this._create,
      elementFactory = this._elementFactory;


  _.extend(actions, {
    'create.start-event': createAction(
      'bpmn:StartEvent', 'event', 'icon-start-event'
    ),
    'create.intermediate-event': createAction(
      'bpmn:IntermediateThrowEvent', 'event', 'icon-intermediate-event'
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'icon-end-event'
    ),
    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway', 'gateway', 'icon-gateway'
    ),
    'create.task': createAction(
      'bpmn:Task', 'activity', 'icon-task'
    ),
    'create.subprocess-collapsed': createAction(
      'bpmn:SubProcess', 'activity', 'icon-subprocess-collapsed', 'Sub Process (collapsed)',
      { isExpanded: false }
    ),
    'create.subprocess-expanded': createAction(
      'bpmn:SubProcess', 'activity', 'icon-subprocess-expanded', 'Sub Process (expanded)',
      { isExpanded: true }
    )
  });

  return actions;
};
},{}],27:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(123)
  ],
  __init__: [ 'paletteProvider' ],
  paletteProvider: [ 'type', _dereq_(26) ],
};

},{}],28:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var LabelUtil = _dereq_(34);

var hasExternalLabel = LabelUtil.hasExternalLabel,
    getExternalLabelBounds = LabelUtil.getExternalLabelBounds,
    isExpanded = _dereq_(33).isExpanded,
    elementToString = _dereq_(31).elementToString;


function elementData(semantic, attrs) {
  return _.extend({
    id: semantic.id,
    type: semantic.$type,
    businessObject: semantic
  }, attrs);
}

function collectWaypoints(waypoints) {
  return _.collect(waypoints, function(p) {
    return { x: p.x, y: p.y };
  });
}


/**
 * An importer that adds bpmn elements to the canvas
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {ElementFactory} elementFactory
 * @param {ElementRegistry} elementRegistry
 */
function BpmnImporter(eventBus, canvas, elementFactory, elementRegistry) {
  this._eventBus = eventBus;
  this._canvas = canvas;

  this._elementFactory = elementFactory;
  this._elementRegistry = elementRegistry;
}

BpmnImporter.$inject = [ 'eventBus', 'canvas', 'elementFactory', 'elementRegistry' ];

module.exports = BpmnImporter;


/**
 * Add bpmn element (semantic) to the canvas onto the
 * specified parent shape.
 */
BpmnImporter.prototype.add = function(semantic, parentElement) {

  var di = semantic.di,
      element;

  // ROOT ELEMENT
  // handle the special case that we deal with a
  // invisible root element (process or collaboration)
  if (di.$instanceOf('bpmndi:BPMNPlane')) {

    // add a virtual element (not being drawn)
    element = this._elementFactory.createRoot(elementData(semantic));

    this._canvas.setRootElement(element);
  }

  // SHAPE
  else if (di.$instanceOf('bpmndi:BPMNShape')) {

    var collapsed = !isExpanded(semantic);
    var hidden = parentElement && (parentElement.hidden || parentElement.collapsed);

    var bounds = semantic.di.bounds;

    element = this._elementFactory.createShape(elementData(semantic, {
      collapsed: collapsed,
      hidden: hidden,
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    }));

    this._canvas.addShape(element, parentElement);
  }

  // CONNECTION
  else if (di.$instanceOf('bpmndi:BPMNEdge')) {

    var source = this._getSource(semantic),
        target = this._getTarget(semantic);

    element = this._elementFactory.createConnection(elementData(semantic, {
      source: source,
      target: target,
      waypoints: collectWaypoints(semantic.di.waypoint)
    }));

    this._canvas.addConnection(element, parentElement);
  } else {
    throw new Error('unknown di ' + elementToString(di) + ' for element ' + elementToString(semantic));
  }

  // (optional) LABEL
  if (hasExternalLabel(semantic)) {
    this.addLabel(semantic, element);
  }


  this._eventBus.fire('bpmnElement.added', { element: element });

  return element;
};


/**
 * add label for an element
 */
BpmnImporter.prototype.addLabel = function(semantic, element) {
  var bounds = getExternalLabelBounds(semantic, element);

  var label = this._elementFactory.createLabel(elementData(semantic, {
    id: semantic.id + '_label',
    labelTarget: element,
    type: 'label',
    hidden: element.hidden,
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height)
  }));

  return this._canvas.addShape(label, element.parent);
};

/**
 * Return the drawn connection end based on the given side.
 *
 * @throws {Error} if the end is not yet drawn
 */
BpmnImporter.prototype._getEnd = function(semantic, side) {

  var element,
      refSemantic,
      refIsParent,
      type = semantic.$type;

  refSemantic = semantic[side + 'Ref'];

  // handle mysterious isMany DataAssociation#sourceRef
  if (side === 'source' && type === 'bpmn:DataInputAssociation') {
    refSemantic = refSemantic && refSemantic[0];
  }

  // fix source / target for DataInputAssociation / DataOutputAssociation
  if (side === 'source' && type === 'bpmn:DataOutputAssociation' ||
      side === 'target' && type === 'bpmn:DataInputAssociation') {

    refSemantic = semantic.$parent;
  }

  element = refSemantic && this._getElement(refSemantic);

  if (element) {
    return element;
  }

  if (refSemantic) {
    throw new Error(
      'element ' + elementToString(refSemantic) + ' referenced by ' +
      elementToString(semantic) + '#' + side + 'Ref not yet drawn');
  } else {
    throw new Error(elementToString(semantic) + '#' + side + 'Ref not specified');
  }
};

BpmnImporter.prototype._getSource = function(semantic) {
  return this._getEnd(semantic, 'source');
};

BpmnImporter.prototype._getTarget = function(semantic) {
  return this._getEnd(semantic, 'target');
};


BpmnImporter.prototype._getElement = function(semantic) {
  return this._elementRegistry.get(semantic.id);
};

},{}],29:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Refs = _dereq_(163);

var elementToString = _dereq_(31).elementToString;

var diRefs = new Refs({ name: 'bpmnElement', enumerable: true }, { name: 'di' });


/**
 * Find a suitable display candidate for definitions where the DI does not
 * correctly specify one.
 */
function findDisplayCandidate(definitions) {
  return _.find(definitions.rootElements, function(e) {
    return e.$instanceOf('bpmn:Process') || e.$instanceOf('bpmn:Collaboration');
  });
}


function BpmnTreeWalker(handler) {

  // list of containers already walked
  var handledProcesses = [];

  // list of elements to handle deferred to ensure
  // prerequisites are drawn
  var deferred = [];

  ///// Helpers /////////////////////////////////

  function contextual(fn, ctx) {
    return function(e) {
      fn(e, ctx);
    };
  }

  function is(element, type) {
    return element.$instanceOf(type);
  }

  function visit(element, ctx) {

    var gfx = element.gfx;

    // avoid multiple rendering of elements
    if (gfx) {
      throw new Error('already rendered ' + elementToString(element));
    }

    // call handler
    return handler.element(element, ctx);
  }

  function visitRoot(element, diagram) {
    return handler.root(element, diagram);
  }

  function visitIfDi(element, ctx) {
    try {
      return element.di && visit(element, ctx);
    } catch (e) {
      logError(e.message, { element: element, error: e });

      console.error('failed to import ' + elementToString(element));
      console.error(e);
    }
  }

  function logError(message, context) {
    handler.error(message, context);
  }

  ////// DI handling ////////////////////////////

  function registerDi(di) {
    var bpmnElement = di.bpmnElement;

    if (bpmnElement) {
      if (bpmnElement.di) {
        logError('multiple DI elements defined for ' + elementToString(bpmnElement), { element: bpmnElement });
      } else {
        diRefs.bind(bpmnElement, 'di');
        bpmnElement.di = di;
      }
    } else {
      logError('no bpmnElement referenced in ' + elementToString(di), { element: di });
    }
  }

  function handleDiagram(diagram) {
    handlePlane(diagram.plane);
  }

  function handlePlane(plane) {
    registerDi(plane);

    _.forEach(plane.planeElement, handlePlaneElement);
  }

  function handlePlaneElement(planeElement) {
    registerDi(planeElement);
  }


  ////// Semantic handling //////////////////////

  function handleDefinitions(definitions, diagram) {
    // make sure we walk the correct bpmnElement

    var diagrams = definitions.diagrams;

    if (diagram && diagrams.indexOf(diagram) === -1) {
      throw new Error('diagram not part of bpmn:Definitions');
    }

    if (!diagram && diagrams && diagrams.length) {
      diagram = diagrams[0];
    }

    // no diagram -> nothing to import
    if (!diagram) {
      return;
    }

    // load DI from selected diagram only
    handleDiagram(diagram);


    var plane = diagram.plane;

    if (!plane) {
      throw new Error('no plane for ' + elementToString(diagram));
    }


    var rootElement = plane.bpmnElement;

    // ensure we default to a suitable display candidate (process or collaboration),
    // even if non is specified in DI
    if (!rootElement) {
      rootElement = findDisplayCandidate(definitions);

      if (!rootElement) {
        throw new Error('do not know what to display');
      } else {

        logError('correcting missing bpmnElement on ' + elementToString(plane) + ' to ' + elementToString(rootElement));

        // correct DI on the fly
        plane.bpmnElement = rootElement;
        registerDi(plane);
      }
    }


    var ctx = visitRoot(rootElement, plane);

    if (is(rootElement, 'bpmn:Process')) {
      handleProcess(rootElement, ctx);
    } else if (is(rootElement, 'bpmn:Collaboration')) {
      handleCollaboration(rootElement, ctx);

      // force drawing of everything not yet drawn that is part of the target DI
      handleUnhandledProcesses(definitions.rootElements, ctx);
    } else {
      throw new Error('unsupported bpmnElement for ' + elementToString(plane) + ' : ' + elementToString(rootElement));
    }

    // handle all deferred elements
    handleDeferred(deferred);
  }

  function handleDeferred(deferred) {
    _.forEach(deferred, function(d) { d(); });
  }

  function handleProcess(process, context) {
    handleFlowElementsContainer(process, context);
    handleIoSpecification(process.ioSpecification, context);

    handleArtifacts(process.artifacts, context);

    // log process handled
    handledProcesses.push(process);
  }

  function handleUnhandledProcesses(rootElements) {

    // walk through all processes that have not yet been drawn and draw them
    // if they contain lanes with DI information.
    // we do this to pass the free-floating lane test cases in the MIWG test suite
    var processes = _.filter(rootElements, function(e) {
      return is(e, 'bpmn:Process') && e.laneSets && handledProcesses.indexOf(e) === -1;
    });

    processes.forEach(contextual(handleProcess));
  }

  function handleMessageFlow(messageFlow, context) {
    visitIfDi(messageFlow, context);
  }

  function handleMessageFlows(messageFlows, context) {
    _.forEach(messageFlows, contextual(handleMessageFlow, context));
  }

  function handleDataAssociation(association, context) {
    visitIfDi(association, context);
  }

  function handleDataInput(dataInput, context) {
    visitIfDi(dataInput, context);
  }

  function handleDataOutput(dataOutput, context) {
    visitIfDi(dataOutput, context);
  }

  function handleArtifact(artifact, context) {

    // bpmn:TextAnnotation
    // bpmn:Group
    // bpmn:Association

    visitIfDi(artifact, context);
  }

  function handleArtifacts(artifacts, context) {

    _.forEach(artifacts, function(e) {
      if (is(e, 'bpmn:Association')) {
        deferred.push(function() {
          handleArtifact(e, context);
        });
      } else {
        handleArtifact(e, context);
      }
    });
  }

  function handleIoSpecification(ioSpecification, context) {

    if (!ioSpecification) {
      return;
    }

    _.forEach(ioSpecification.dataInputs, contextual(handleDataInput, context));
    _.forEach(ioSpecification.dataOutputs, contextual(handleDataOutput, context));
  }

  function handleSubProcess(subProcess, context) {
    handleFlowElementsContainer(subProcess, context);
    handleArtifacts(subProcess.artifacts, context);
  }

  function handleFlowNode(flowNode, context) {
    var childCtx = visitIfDi(flowNode, context);

    if (is(flowNode, 'bpmn:SubProcess')) {
      handleSubProcess(flowNode, childCtx || context);
    }
  }

  function handleSequenceFlow(sequenceFlow, context) {
    visitIfDi(sequenceFlow, context);
  }

  function handleDataElement(dataObject, context) {
    visitIfDi(dataObject, context);
  }

  function handleBoundaryEvent(dataObject, context) {
    visitIfDi(dataObject, context);
  }

  function handleLane(lane, context) {
    var newContext = visitIfDi(lane, context);

    if (lane.childLaneSet) {
      handleLaneSet(lane.childLaneSet, newContext || context);
    } else {
      var filterList = _.filter(lane.flowNodeRef, function(e) {
        return e.$type !== 'bpmn:BoundaryEvent';
      });
      handleFlowElements(filterList, newContext || context);
    }
  }

  function handleLaneSet(laneSet, context) {
    _.forEach(laneSet.lanes, contextual(handleLane, context));
  }

  function handleLaneSets(laneSets, context) {
    _.forEach(laneSets, contextual(handleLaneSet, context));
  }

  function handleFlowElementsContainer(container, context) {

    if (container.laneSets) {
      handleLaneSets(container.laneSets, context);
      handleNonFlowNodes(container.flowElements);
    } else {
      handleFlowElements(container.flowElements, context);
    }
  }

  function handleNonFlowNodes(flowElements, context) {
    _.forEach(flowElements, function(e) {
      if (is(e, 'bpmn:SequenceFlow')) {
        deferred.push(function() {
          handleSequenceFlow(e, context);
        });
      } else if (is(e, 'bpmn:BoundaryEvent')) {
        deferred.unshift(function() {
          handleBoundaryEvent(e, context);
        });
      } else if (is(e, 'bpmn:DataObject')) {
        // SKIP (assume correct referencing via DataObjectReference)
      } else if (is(e, 'bpmn:DataStoreReference')) {
        handleDataElement(e, context);
      } else if (is(e, 'bpmn:DataObjectReference')) {
        handleDataElement(e, context);
      }
    });
  }

  function handleFlowElements(flowElements, context) {
    _.forEach(flowElements, function(e) {
      if (is(e, 'bpmn:SequenceFlow')) {
        deferred.push(function() {
          handleSequenceFlow(e, context);
        });
      } else if (is(e, 'bpmn:BoundaryEvent')) {
        deferred.unshift(function() {
          handleBoundaryEvent(e, context);
        });
      } else if (is(e, 'bpmn:FlowNode')) {
        handleFlowNode(e, context);

        if (is(e, 'bpmn:Activity')) {

          handleIoSpecification(e.ioSpecification, context);

          // defer handling of associations
          deferred.push(function() {
            _.forEach(e.dataInputAssociations, contextual(handleDataAssociation, context));
            _.forEach(e.dataOutputAssociations, contextual(handleDataAssociation, context));
          });
        }
      } else if (is(e, 'bpmn:DataObject')) {
        // SKIP (assume correct referencing via DataObjectReference)
      } else if (is(e, 'bpmn:DataStoreReference')) {
        handleDataElement(e, context);
      } else if (is(e, 'bpmn:DataObjectReference')) {
        handleDataElement(e, context);
      } else {
        logError(
          'unrecognized flowElement ' + elementToString(e) + ' in context ' +
          (context ? elementToString(context.businessObject) : null),
          { element: e, context: context });
      }
    });
  }

  function handleParticipant(participant, context) {
    var newCtx = visitIfDi(participant, context);

    var process = participant.processRef;
    if (process) {
      handleProcess(process, newCtx || context);
    }
  }

  function handleCollaboration(collaboration) {

    _.forEach(collaboration.participants, contextual(handleParticipant));

    handleArtifacts(collaboration.artifacts);

    // handle message flows latest in the process
    deferred.push(function() {
      handleMessageFlows(collaboration.messageFlows);
    });
  }


  ///// API ////////////////////////////////

  return {
    handleDefinitions: handleDefinitions
  };
}

module.exports = BpmnTreeWalker;
},{}],30:[function(_dereq_,module,exports){
'use strict';

var BpmnTreeWalker = _dereq_(29);


/**
 * Import the definitions into a diagram.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {Diagram} diagram
 * @param  {ModdleElement} definitions
 * @param  {Function} done the callback, invoked with (err, [ warning ]) once the import is done
 */
function importBpmnDiagram(diagram, definitions, done) {

  var importer = diagram.get('bpmnImporter'),
      eventBus = diagram.get('eventBus');

  var error,
      warnings = [];

  function parse(definitions) {

    var visitor = {

      root: function(element) {
        return importer.add(element);
      },

      element: function(element, parentShape) {
        return importer.add(element, parentShape);
      },

      error: function(message, context) {
        warnings.push({ message: message, context: context });
      }
    };

    var walker = new BpmnTreeWalker(visitor);

    // import
    walker.handleDefinitions(definitions);
  }

  eventBus.fire('import.start');

  try {
    parse(definitions);
  } catch (e) {
    error = e;
  }

  eventBus.fire(error ? 'import.error' : 'import.success', { error: error, warnings: warnings });
  done(error, warnings);
}

module.exports.importBpmnDiagram = importBpmnDiagram;
},{}],31:[function(_dereq_,module,exports){
module.exports.elementToString = function(e) {
  if (!e) {
    return '<null>';
  }

  return '<' + e.$type + (e.id ? ' id="' + e.id : '') + '" />';
};
},{}],32:[function(_dereq_,module,exports){
module.exports = {
  bpmnImporter: [ 'type', _dereq_(28) ]
};
},{}],33:[function(_dereq_,module,exports){
'use strict';

module.exports.isExpandedPool = function(semantic) {
  return !!semantic.processRef;
};

module.exports.isExpanded = function(semantic) {

  // Is type expanded by default?
  var isDefaultExpanded = !(semantic.$instanceOf('bpmn:SubProcess') || semantic.$instanceOf('bpmn:CallActivity'));

  // For non default expanded types -> evaluate the expanded flag
  var isExpanded = isDefaultExpanded || semantic.di.isExpanded;

  return isExpanded;
};

},{}],34:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


var DEFAULT_LABEL_SIZE = module.exports.DEFAULT_LABEL_SIZE = {
  width: 90,
  height: 20
};


/**
 * Returns true if the given semantic has an external label
 *
 * @param {BpmnElement} semantic
 * @return {Boolean} true if has label
 */
module.exports.hasExternalLabel = function(semantic) {

  return semantic.$instanceOf('bpmn:Event') ||
         semantic.$instanceOf('bpmn:Gateway') ||
         semantic.$instanceOf('bpmn:DataStoreReference') ||
         semantic.$instanceOf('bpmn:DataObjectReference') ||
         semantic.$instanceOf('bpmn:SequenceFlow') ||
         semantic.$instanceOf('bpmn:MessageFlow');
};


/**
 * Get the middle of a number of waypoints
 *
 * @param  {Array<Point>} waypoints
 * @return {Point} the mid point
 */
var getWaypointsMid = module.exports.getWaypointsMid = function(waypoints) {

  var mid = waypoints.length / 2 - 1;

  var first = waypoints[Math.floor(mid)];
  var second = waypoints[Math.ceil(mid + 0.01)];

  return {
    x: first.x + (second.x - first.x) / 2,
    y: first.y + (second.y - first.y) / 2
  };
};


var getExternalLabelMid = module.exports.getExternalLabelMid = function(element) {

  if (element.waypoints) {
    return getWaypointsMid(element.waypoints);
  } else {
    return {
      x: element.x + element.width / 2,
      y: element.y + element.height + DEFAULT_LABEL_SIZE.height / 2
    };
  }
};

/**
 * Returns the bounds of an elements label, parsed from the elements DI or
 * generated from its bounds.
 *
 * @param {BpmnElement} semantic
 * @param {djs.model.Base} element
 */
module.exports.getExternalLabelBounds = function(semantic, element) {

  var mid,
      size,
      bounds,
      di = semantic.di,
      label = di.label;

  if (label && label.bounds) {
    bounds = label.bounds;

    size = {
      width: Math.max(DEFAULT_LABEL_SIZE.width, bounds.width),
      height: bounds.height
    };

    mid = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
  } else {

    mid = getExternalLabelMid(element);

    size = DEFAULT_LABEL_SIZE;
  }

  return _.extend({
    x: mid.x - size.width / 2,
    y: mid.y - size.height / 2
  }, size);
};
},{}],35:[function(_dereq_,module,exports){
module.exports = _dereq_(38);
},{}],36:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Moddle = _dereq_(44),
    ModdleXml = _dereq_(39);

/**
 * A sub class of {@link Moddle} with support for import and export of BPMN 2.0 xml files.
 *
 * @class BpmnModdle
 * @extends Moddle
 *
 * @param {Object|Array} packages to use for instantiating the model
 * @param {Object} [options] additional options to pass over
 */
function BpmnModdle(packages, options) {
  Moddle.call(this, packages, options);
}

BpmnModdle.prototype = Object.create(Moddle.prototype);

module.exports = BpmnModdle;


/**
 * Instantiates a BPMN model tree from a given xml string.
 *
 * @param {String}   xmlStr
 * @param {String}   [typeName]   name of the root element, defaults to 'bpmn:Definitions'
 * @param {Object}   [options]    options to pass to the underlying reader
 * @param {Function} done         callback that is invoked with (err, result, parseContext) once the import completes
 */
BpmnModdle.prototype.fromXML = function(xmlStr, typeName, options, done) {

  if (!_.isString(typeName)) {
    done = options;
    options = typeName;
    typeName = 'bpmn:Definitions';
  }

  if (_.isFunction(options)) {
    done = options;
    options = {};
  }

  var reader = new ModdleXml.Reader(this, options);
  var rootHandler = reader.handler(typeName);

  reader.fromXML(xmlStr, rootHandler, done);
};


/**
 * Serializes a BPMN 2.0 object tree to XML.
 *
 * @param {String}   element    the root element, typically an instance of `bpmn:Definitions`
 * @param {Object}   [options]  to pass to the underlying writer
 * @param {Function} done       callback invoked with (err, xmlStr) once the import completes
 */
BpmnModdle.prototype.toXML = function(element, options, done) {

  if (_.isFunction(options)) {
    done = options;
    options = {};
  }

  var writer = new ModdleXml.Writer(options);
  try {
    var result = writer.toXML(element);
    done(null, result);
  } catch (e) {
    done(e);
  }
};

},{}],37:[function(_dereq_,module,exports){
'use strict';

/**
 * Extends the bpmn instance with id support.
 *
 * @example
 *
 * var moddle, ids;
 *
 * require('id-support').extend(moddle, ids);
 *
 * moddle.ids.next(); // create a next id
 * moddle.ids; // ids instance
 *
 * // claims id as used
 * moddle.create('foo:Bar', { id: 'fooobar1' });
 *
 *
 * @param  {Moddle} model
 * @param  {Ids} ids
 *
 * @return {Moddle} the extended moddle instance
 */
module.exports.extend = function(model, ids) {

  model.ids = ids;

  var set = model.properties.set;

  var ID_PATTERN = /^(.*:)?id$/;

  model.properties.set = function(target, property, value) {

    // ensure we log used ids once they are assigned
    // to model elements
    if (ID_PATTERN.test(property)) {

      var assigned = ids.assigned(value);
      if (assigned && assigned !== target) {
        throw new Error('id <' + value + '> already used');
      }

      ids.claim(value, target);
    }

    set.call(this, target, property, value);
  };

  return model;
};
},{}],38:[function(_dereq_,module,exports){
var BpmnModdle = _dereq_(36);

var packages = {
  bpmn: _dereq_(53),
  bpmndi: _dereq_(54),
  dc: _dereq_(55),
  di: _dereq_(56)
};

module.exports = function() {
  return new BpmnModdle(packages);
};
},{}],39:[function(_dereq_,module,exports){
'use strict';

module.exports.Reader = _dereq_(41);
module.exports.Writer = _dereq_(42);
},{}],40:[function(_dereq_,module,exports){
'use strict';


function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function lower(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function hasLowerCaseAlias(pkg) {
  return pkg.xml && pkg.xml.tagAlias === 'lowerCase';
}


module.exports.aliasToName = function(alias, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return capitalize(alias);
  } else {
    return alias;
  }
};

module.exports.nameToAlias = function(name, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return lower(name);
  } else {
    return name;
  }
};

module.exports.DEFAULT_NS_MAP = {
  'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
};

module.exports.XSI_TYPE = 'xsi:type';
},{}],41:[function(_dereq_,module,exports){
'use strict';

var sax = (window.sax),
    _ = (window._);

var common = _dereq_(40),
    XSI_TYPE = common.XSI_TYPE,
    XSI_URI = common.DEFAULT_NS_MAP.xsi,
    Types = _dereq_(44).types,
    Stack = _dereq_(43),
    parseNameNs = _dereq_(44).ns.parseName,
    aliasToName = common.aliasToName;


function parseNodeAttributes(node) {
  var nodeAttrs = node.attributes;

  return _.reduce(nodeAttrs, function(result, v, k) {
    var name, ns;

    if (!v.local) {
      name = v.prefix;
    } else {
      ns = parseNameNs(v.name, v.prefix);
      name = ns.name;
    }

    result[name] = v.value;
    return result;
  }, {});
}

function normalizeType(node, attr, model) {
  var nameNs = parseNameNs(attr.value);

  var uri = node.ns[nameNs.prefix || ''],
      localName = nameNs.localName,
      pkg = uri && model.getPackage(uri),
      typePrefix;

  if (pkg) {
    typePrefix = pkg.xml && pkg.xml.typePrefix;

    if (typePrefix && localName.indexOf(typePrefix) === 0) {
      localName = localName.slice(typePrefix.length);
    }

    attr.value = pkg.prefix + ':' + localName;
  }
}

/**
 * Normalizes namespaces for a node given an optional default namespace and a
 * number of mappings from uris to default prefixes.
 *
 * @param  {XmlNode} node
 * @param  {Model} model the model containing all registered namespaces
 * @param  {Uri} defaultNsUri
 */
function normalizeNamespaces(node, model, defaultNsUri) {
  var uri, prefix;

  uri = node.uri || defaultNsUri;

  if (uri) {
    var pkg = model.getPackage(uri);

    if (pkg) {
      prefix = pkg.prefix;
    } else {
      prefix = node.prefix;
    }

    node.prefix = prefix;
    node.uri = uri;
  }

  _.forEach(node.attributes, function(attr) {

    // normalize xsi:type attributes because the
    // assigned type may or may not be namespace prefixed
    if (attr.uri === XSI_URI && attr.local === 'type') {
      normalizeType(node, attr, model);
    }

    normalizeNamespaces(attr, model, null);
  });
}

/**
 * A parse context.
 *
 * @class
 *
 * @param {ElementHandler} parseRoot the root handler for parsing a document
 */
function Context(parseRoot) {

  var elementsById = {};
  var references = [];

  var warnings = [];

  this.addReference = function(reference) {
    references.push(reference);
  };

  this.addElement = function(id, element) {

    if (!id || !element) {
      throw new Error('[xml-reader] id or ctx must not be null');
    }

    elementsById[id] = element;
  };

  this.addWarning = function (w) {
    warnings.push(w);
  };

  this.warnings = warnings;
  this.references = references;

  this.elementsById = elementsById;

  this.parseRoot = parseRoot;
}


function BaseHandler() {}

BaseHandler.prototype.handleEnd = function() {};
BaseHandler.prototype.handleText = function() {};
BaseHandler.prototype.handleNode = function() {};

function BodyHandler() {}

BodyHandler.prototype = new BaseHandler();

BodyHandler.prototype.handleText = function(text) {
  this.body = (this.body || '') + text;
};

function ReferenceHandler(property, context) {
  this.property = property;
  this.context = context;
}

ReferenceHandler.prototype = new BodyHandler();

ReferenceHandler.prototype.handleNode = function(node) {

  if (this.element) {
    throw new Error('expected no sub nodes');
  } else {
    this.element = this.createReference(node);
  }

  return this;
};

ReferenceHandler.prototype.handleEnd = function() {
  this.element.id = this.body;
};

ReferenceHandler.prototype.createReference = function() {
  return {
    property: this.property.ns.name,
    id: ''
  };
};

function ValueHandler(propertyDesc, element) {
  this.element = element;
  this.propertyDesc = propertyDesc;
}

ValueHandler.prototype = new BodyHandler();

ValueHandler.prototype.handleEnd = function() {

  var value = this.body,
      element = this.element,
      propertyDesc = this.propertyDesc;

  value = Types.coerceType(propertyDesc.type, value);

  if (propertyDesc.isMany) {
    element.get(propertyDesc.name).push(value);
  } else {
    element.set(propertyDesc.name, value);
  }
};


function BaseElementHandler() {}

BaseElementHandler.prototype = Object.create(BodyHandler.prototype);

BaseElementHandler.prototype.handleNode = function(node) {
  var parser = this,
      element = this.element,
      id;

  if (!element) {
    element = this.element = this.createElement(node);
    id = element.id;

    if (id) {
      this.context.addElement(id, element);
    }
  } else {
    parser = this.handleChild(node);
  }

  return parser;
};

/**
 * @class XMLReader.ElementHandler
 *
 */
function ElementHandler(model, type, context) {
  this.model = model;
  this.type = model.getType(type);
  this.context = context;
}

ElementHandler.prototype = new BaseElementHandler();

ElementHandler.prototype.addReference = function(reference) {
  this.context.addReference(reference);
};

ElementHandler.prototype.handleEnd = function() {

  var value = this.body,
      element = this.element,
      descriptor = element.$descriptor,
      bodyProperty = descriptor.bodyProperty;

  if (bodyProperty && value !== undefined) {
    value = Types.coerceType(bodyProperty.type, value);
    element.set(bodyProperty.name, value);
  }
};

/**
 * Create an instance of the model from the given node.
 *
 * @param  {Element} node the xml node
 */
ElementHandler.prototype.createElement = function(node) {
  var attributes = parseNodeAttributes(node),
      Type = this.type,
      descriptor = Type.$descriptor,
      context = this.context,
      instance = new Type({});

  _.forEach(attributes, function(value, name) {

    var prop = descriptor.propertiesByName[name];

    if (prop && prop.isReference) {
      context.addReference({
        element: instance,
        property: prop.ns.name,
        id: value
      });
    } else {
      if (prop) {
        value = Types.coerceType(prop.type, value);
      }

      instance.set(name, value);
    }
  });

  return instance;
};

ElementHandler.prototype.getPropertyForNode = function(node) {

  var nameNs = parseNameNs(node.local, node.prefix);

  var type = this.type,
      model = this.model,
      descriptor = type.$descriptor;

  var propertyName = nameNs.name,
      property = descriptor.propertiesByName[propertyName],
      elementTypeName,
      elementType,
      typeAnnotation;

  // search for properties by name first

  if (property) {

    if (property.serialize === XSI_TYPE) {
      typeAnnotation = node.attributes[XSI_TYPE];

      // xsi type is optional, if it does not exists the
      // default type is assumed
      if (typeAnnotation) {

        elementTypeName = typeAnnotation.value;

        // TODO: extract real name from attribute
        elementType = model.getType(elementTypeName);

        return _.extend({}, property, { effectiveType: elementType.$descriptor.name });
      }
    }

    // search for properties by name first
    return property;
  }


  var pkg = model.getPackage(nameNs.prefix);

  if (pkg) {
    elementTypeName = nameNs.prefix + ':' + aliasToName(nameNs.localName, descriptor.$pkg);
    elementType = model.getType(elementTypeName);

    // search for collection members later
    property = _.find(descriptor.properties, function(p) {
      return !p.isVirtual && !p.isReference && !p.isAttribute && elementType.hasType(p.type);
    });

    if (property) {
      return _.extend({}, property, { effectiveType: elementType.$descriptor.name });
    }
  } else {
    // parse unknown element (maybe extension)
    property = _.find(descriptor.properties, function(p) {
      return !p.isReference && !p.isAttribute && p.type === 'Element';
    });

    if (property) {
      return property;
    }
  }

  throw new Error('unrecognized element <' + nameNs.name + '>');
};

ElementHandler.prototype.toString = function() {
  return 'ElementDescriptor[' + this.type.$descriptor.name + ']';
};

ElementHandler.prototype.valueHandler = function(propertyDesc, element) {
  return new ValueHandler(propertyDesc, element);
};

ElementHandler.prototype.referenceHandler = function(propertyDesc) {
  return new ReferenceHandler(propertyDesc, this.context);
};

ElementHandler.prototype.handler = function(type) {
  if (type === 'Element') {
    return new GenericElementHandler(this.model, type, this.context);
  } else {
    return new ElementHandler(this.model, type, this.context);
  }
};

/**
 * Handle the child element parsing
 *
 * @param  {Element} node the xml node
 */
ElementHandler.prototype.handleChild = function(node) {
  var propertyDesc, type, element, childHandler;

  propertyDesc = this.getPropertyForNode(node);
  element = this.element;

  type = propertyDesc.effectiveType || propertyDesc.type;

  if (Types.isSimple(type)) {
    return this.valueHandler(propertyDesc, element);
  }

  if (propertyDesc.isReference) {
    childHandler = this.referenceHandler(propertyDesc).handleNode(node);
  } else {
    childHandler = this.handler(type).handleNode(node);
  }

  var newElement = childHandler.element;

  // child handles may decide to skip elements
  // by not returning anything
  if (newElement !== undefined) {

    if (propertyDesc.isMany) {
      element.get(propertyDesc.name).push(newElement);
    } else {
      element.set(propertyDesc.name, newElement);
    }

    if (propertyDesc.isReference) {
      _.extend(newElement, {
        element: element
      });

      this.context.addReference(newElement);
    } else {
      // establish child -> parent relationship
      newElement.$parent = element;
    }
  }

  return childHandler;
};


function GenericElementHandler(model, type, context) {
  this.model = model;
  this.context = context;
}

GenericElementHandler.prototype = Object.create(BaseElementHandler.prototype);

GenericElementHandler.prototype.createElement = function(node) {

  var name = node.name,
      prefix = node.prefix,
      uri = node.ns[prefix],
      attributes = node.attributes;

  return this.model.createAny(name, uri, attributes);
};

GenericElementHandler.prototype.handleChild = function(node) {

  var handler = new GenericElementHandler(this.model, 'Element', this.context).handleNode(node),
      element = this.element;

  var newElement = handler.element,
      children;

  if (newElement !== undefined) {
    children = element.$children = element.$children || [];
    children.push(newElement);

    // establish child -> parent relationship
    newElement.$parent = element;
  }

  return handler;
};

GenericElementHandler.prototype.handleText = function(text) {
  this.body = this.body || '' + text;
};

GenericElementHandler.prototype.handleEnd = function() {
  if (this.body) {
    this.element.$body = this.body;
  }
};

/**
 * A reader for a meta-model
 *
 * @class XMLReader
 *
 * @param {Model} model used to read xml files
 */
function XMLReader(model) {
  this.model = model;
}


XMLReader.prototype.fromXML = function(xml, rootHandler, done) {

  var context = new Context(rootHandler);

  var parser = sax.parser(true, { xmlns: true, trim: true }),
      stack = new Stack();

  var model = this.model;

  rootHandler.context = context;

  // push root handler
  stack.push(rootHandler);


  function resolveReferences() {

    var elementsById = context.elementsById;
    var references = context.references;

    var i, r;

    for (i = 0; !!(r = references[i]); i++) {
      var element = r.element;
      var reference = elementsById[r.id];
      var property = element.$descriptor.propertiesByName[r.property];

      if (!reference) {
        context.addWarning({
          message: 'unresolved reference <' + r.id + '>',
          element: r.element,
          property: r.property,
          value: r.id
        });
      }

      if (property.isMany) {
        var collection = element.get(property.name),
            idx = collection.indexOf(r);

        if (!reference) {
          // remove unresolvable reference
          collection.splice(idx, 1);
        } else {
          // update reference
          collection[idx] = reference;
        }
      } else {
        element.set(property.name, reference);
      }
    }
  }

  function handleClose(tagName) {
    stack.pop().handleEnd();
  }

  function handleOpen(node) {
    var handler = stack.peek();

    normalizeNamespaces(node, model);

    try {
      stack.push(handler.handleNode(node));
    } catch (e) {

      var line = this.line,
          column = this.column;

      console.error('failed to parse document');
      console.error(e);

      throw new Error(
        'unparsable content <' + node.name + '> detected\n\t' +
          'line: ' + line + '\n\t' +
          'column: ' + column + '\n\t' +
          'nested error: ' + e.message);
    }
  }

  function handleText(text) {
    stack.peek().handleText(text);
  }

  parser.onopentag = handleOpen;
  parser.oncdata = parser.ontext = handleText;
  parser.onclosetag = handleClose;
  parser.onend = resolveReferences;

  // deferred parse XML to make loading really ascnchronous
  // this ensures the execution environment (node or browser)
  // is kept responsive and that certain optimization strategies
  // can kick in
  _.defer(function() {
    var error;

    try {
      parser.write(xml).close();
    } catch (e) {
      error = e;
    }

    done(error, error ? undefined : rootHandler.element, context);
  });
};

XMLReader.prototype.handler = function(name) {
  return new ElementHandler(this.model, name);
};

module.exports = XMLReader;
module.exports.ElementHandler = ElementHandler;
},{}],42:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Types = _dereq_(44).types,
    common = _dereq_(40),
    parseNameNs = _dereq_(44).ns.parseName,
    nameToAlias = common.nameToAlias;

var XML_PREAMBLE = '<?xml version="1.0" encoding="UTF-8"?>\n';

var CDATA_ESCAPE = /[<>"&]+/;

var DEFAULT_NS_MAP = common.DEFAULT_NS_MAP,
    XSI_TYPE = common.XSI_TYPE;


function nsName(ns) {
  if (_.isString(ns)) {
    return ns;
  } else {
    return (ns.prefix ? ns.prefix + ':' : '') + ns.localName;
  }
}

function getElementNs(ns, descriptor) {
  if (descriptor.isGeneric) {
    return descriptor.name;
  } else {
    return _.extend({ localName: nameToAlias(descriptor.ns.localName, descriptor.$pkg) }, ns);
  }
}

function getPropertyNs(ns, descriptor) {
  return _.extend({ localName: descriptor.ns.localName }, ns);
}

function getSerializableProperties(element) {
  var descriptor = element.$descriptor;

  return _.filter(descriptor.properties, function(p) {
    var name = p.name;

    // do not serialize defaults
    if (!element.hasOwnProperty(name)) {
      return false;
    }

    var value = element[name];

    // do not serialize default equals
    if (value === p.default) {
      return false;
    }

    return p.isMany ? value.length : true;
  });
}

/**
 * Escape a string attribute to not contain any bad values (line breaks, '"', ...)
 *
 * @param {String} str the string to escape
 * @return {String} the escaped string
 */
function escapeAttr(str) {
  var escapeMap = {
    '\n': '&#10;',
    '\n\r': '&#10;',
    '"': '&quot;'
  };

  // ensure we are handling strings here
  str = _.isString(str) ? str : '' + str;

  return str.replace(/(\n|\n\r|")/g, function(str) {
    return escapeMap[str];
  });
}

function filterAttributes(props) {
  return _.filter(props, function(p) { return p.isAttr; });
}

function filterContained(props) {
  return _.filter(props, function(p) { return !p.isAttr; });
}


function ReferenceSerializer(parent, ns) {
  this.ns = ns;
}

ReferenceSerializer.prototype.build = function(element) {
  this.element = element;
  return this;
};

ReferenceSerializer.prototype.serializeTo = function(writer) {
  writer
    .appendIndent()
    .append('<' + nsName(this.ns) + '>' + this.element.id + '</' + nsName(this.ns) + '>')
    .appendNewLine();
};

function BodySerializer() {}

BodySerializer.prototype.serializeValue = BodySerializer.prototype.serializeTo = function(writer) {
  var escape = this.escape;

  if (escape) {
    writer.append('<![CDATA[');
  }

  writer.append(this.value);

  if (escape) {
    writer.append(']]>');
  }
};

BodySerializer.prototype.build = function(prop, value) {
  this.value = value;

  if (prop.type === 'String' && CDATA_ESCAPE.test(value)) {
    this.escape = true;
  }

  return this;
};

function ValueSerializer(ns) {
  this.ns = ns;
}

ValueSerializer.prototype = new BodySerializer();

ValueSerializer.prototype.serializeTo = function(writer) {

  writer
    .appendIndent()
    .append('<' + nsName(this.ns) + '>');

  this.serializeValue(writer);

  writer
    .append( '</' + nsName(this.ns) + '>')
    .appendNewLine();
};

function ElementSerializer(parent, ns) {
  this.body = [];
  this.attrs = [];

  this.parent = parent;
  this.ns = ns;
}

ElementSerializer.prototype.build = function(element) {
  this.element = element;

  var otherAttrs = this.parseNsAttributes(element);

  if (!this.ns) {
    this.ns = this.nsTagName(element.$descriptor);
  }

  if (element.$descriptor.isGeneric) {
    this.parseGeneric(element);
  } else {
    var properties = getSerializableProperties(element);

    this.parseAttributes(filterAttributes(properties));
    this.parseContainments(filterContained(properties));

    this.parseGenericAttributes(element, otherAttrs);
  }

  return this;
};

ElementSerializer.prototype.nsTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getElementNs(effectiveNs, descriptor);
};

ElementSerializer.prototype.nsPropertyTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getPropertyNs(effectiveNs, descriptor);
};

ElementSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.ns.uri;
};

ElementSerializer.prototype.nsAttributeName = function(element) {

  var ns;

  if (_.isString(element)) {
    ns = parseNameNs(element);
  } else
  if (element.ns) {
    ns = element.ns;
  }

  var effectiveNs = this.logNamespaceUsed(ns);

  // strip prefix if same namespace like parent
  if (this.isLocalNs(effectiveNs)) {
    return { localName: ns.localName };
  } else {
    return _.extend({ localName: ns.localName }, effectiveNs);
  }
};

ElementSerializer.prototype.parseGeneric = function(element) {

  var self = this,
      body = this.body,
      attrs = this.attrs;

  _.forEach(element, function(val, key) {

    if (key === '$body') {
      body.push(new BodySerializer().build({ type: 'String' }, val));
    } else
    if (key === '$children') {
      _.forEach(val, function(child) {
        body.push(new ElementSerializer(self).build(child));
      });
    } else
    if (key.indexOf('$') !== 0) {
      attrs.push({ name: key, value: escapeAttr(val) });
    }
  });
};

/**
 * Parse namespaces and return a list of left over generic attributes
 *
 * @param  {Object} element
 * @return {Array<Object>}
 */
ElementSerializer.prototype.parseNsAttributes = function(element) {
  var self = this;

  var genericAttrs = element.$attrs;

  var attributes = [];

  // parse namespace attributes first
  // and log them. push non namespace attributes to a list
  // and process them later
  _.forEach(genericAttrs, function(value, name) {
    var nameNs = parseNameNs(name);

    if (nameNs.prefix === 'xmlns') {
      self.logNamespace({ prefix: nameNs.localName, uri: value });
    } else
    if (!nameNs.prefix && nameNs.localName === 'xmlns') {
      self.logNamespace({ uri: value });
    } else {
      attributes.push({ name: name, value: value });
    }
  });

  return attributes;
};

ElementSerializer.prototype.parseGenericAttributes = function(element, attributes) {

  var self = this;

  _.forEach(attributes, function(attr) {

    // do not serialize xsi:type attribute
    // it is set manually based on the actual implementation type
    if (attr.name === XSI_TYPE) {
      return;
    }

    try {
      self.addAttribute(self.nsAttributeName(attr.name), attr.value);
    } catch (e) {
      console.warn('[writer] missing namespace information for ', attr.name, '=', attr.value, 'on', element, e);
    }
  });
};

ElementSerializer.prototype.parseContainments = function(properties) {

  var self = this,
      body = this.body,
      element = this.element;

  _.forEach(properties, function(p) {
    var value = element.get(p.name),
        isReference = p.isReference,
        isMany = p.isMany;

    var ns = self.nsPropertyTagName(p);

    if (!isMany) {
      value = [ value ];
    }

    if (p.isBody) {
      body.push(new BodySerializer().build(p, value[0]));
    } else
    if (Types.isSimple(p.type)) {
      _.forEach(value, function(v) {
        body.push(new ValueSerializer(ns).build(p, v));
      });
    } else
    if (isReference) {
      _.forEach(value, function(v) {
        body.push(new ReferenceSerializer(self, ns).build(v));
      });
    } else {
      // allow serialization via type
      // rather than element name
      var asType = p.serialize === XSI_TYPE;

      _.forEach(value, function(v) {
        var serializer;

        if (asType) {
          serializer = new TypeSerializer(self, ns);
        } else {
          serializer = new ElementSerializer(self);
        }

        body.push(serializer.build(v));
      });
    }
  });
};

ElementSerializer.prototype.getNamespaces = function() {
  if (!this.parent) {
    if (!this.namespaces) {
      this.namespaces = {
        prefixMap: {},
        uriMap: {},
        used: {}
      };
    }
  } else {
    this.namespaces = this.parent.getNamespaces();
  }

  return this.namespaces;
};

ElementSerializer.prototype.logNamespace = function(ns) {
  var namespaces = this.getNamespaces();

  var existing = namespaces.uriMap[ns.uri];

  if (!existing) {
    namespaces.uriMap[ns.uri] = ns;
  }

  namespaces.prefixMap[ns.prefix] = ns.uri;

  return ns;
};

ElementSerializer.prototype.logNamespaceUsed = function(ns) {
  var element = this.element,
      model = element.$model,
      namespaces = this.getNamespaces();

  // ns may be
  //
  //   * prefix only
  //   * prefix:uri

  var prefix = ns.prefix;
  var uri = ns.uri || DEFAULT_NS_MAP[prefix] ||
            namespaces.prefixMap[prefix] || (model ? (model.getPackage(prefix) || {}).uri : null);

  if (!uri) {
    throw new Error('no namespace uri given for prefix <' + ns.prefix + '>');
  }

  ns = namespaces.uriMap[uri];

  if (!ns) {
    ns = this.logNamespace({ prefix: prefix, uri: uri });
  }

  if (!namespaces.used[ns.uri]) {
    namespaces.used[ns.uri] = ns;
  }

  return ns;
};

ElementSerializer.prototype.parseAttributes = function(properties) {
  var self = this,
      element = this.element;

  _.forEach(properties, function(p) {
    self.logNamespaceUsed(p.ns);

    var value = element.get(p.name);

    if (p.isReference) {
      value = value.id;
    }

    self.addAttribute(self.nsAttributeName(p), value);
  });
};

ElementSerializer.prototype.addAttribute = function(name, value) {
  var attrs = this.attrs;

  if (_.isString(value)) {
    value = escapeAttr(value);
  }

  attrs.push({ name: name, value: value });
};

ElementSerializer.prototype.serializeAttributes = function(writer) {
  var attrs = this.attrs,
      root = !this.parent,
      namespaces = this.namespaces;

  function collectNsAttrs() {
    return _.collect(namespaces.used, function(ns) {
      var name = 'xmlns' + (ns.prefix ? ':' + ns.prefix : '');
      return { name: name, value: ns.uri };
    });
  }

  if (root) {
    attrs = collectNsAttrs().concat(attrs);
  }

  _.forEach(attrs, function(a) {
    writer
      .append(' ')
      .append(nsName(a.name)).append('="').append(a.value).append('"');
  });
};

ElementSerializer.prototype.serializeTo = function(writer) {
  var hasBody = this.body.length,
      indent = !(this.body.length === 1 && this.body[0] instanceof BodySerializer);

  writer
    .appendIndent()
    .append('<' + nsName(this.ns));

  this.serializeAttributes(writer);

  writer.append(hasBody ? '>' : ' />');

  if (hasBody) {

    if (indent) {
      writer
        .appendNewLine()
        .indent();
    }

    _.forEach(this.body, function(b) {
      b.serializeTo(writer);
    });

    if (indent) {
      writer
        .unindent()
        .appendIndent();
    }

    writer.append('</' + nsName(this.ns) + '>');
  }

  writer.appendNewLine();
};

/**
 * A serializer for types that handles serialization of data types
 */
function TypeSerializer(parent, ns) {
  ElementSerializer.call(this, parent, ns);
}

TypeSerializer.prototype = new ElementSerializer();

TypeSerializer.prototype.build = function(element) {
  var descriptor = element.$descriptor;

  this.element = element;

  this.typeNs = this.nsTagName(descriptor);

  // add xsi:type attribute to represent the elements
  // actual type

  var typeNs = this.typeNs,
      pkg = element.$model.getPackage(typeNs.uri),
      typePrefix = (pkg.xml && pkg.xml.typePrefix) || '';

  this.addAttribute(this.nsAttributeName(XSI_TYPE),
    (typeNs.prefix ? typeNs.prefix + ':' : '') +
    typePrefix + descriptor.ns.localName);

  // do the usual stuff
  return ElementSerializer.prototype.build.call(this, element);
};

TypeSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.typeNs.uri;
};

function SavingWriter() {
  this.value = '';

  this.write = function(str) {
    this.value += str;
  };
}

function FormatingWriter(out, format) {

  var indent = [''];

  this.append = function(str) {
    out.write(str);

    return this;
  };

  this.appendNewLine = function() {
    if (format) {
      out.write('\n');
    }

    return this;
  };

  this.appendIndent = function() {
    if (format) {
      out.write(indent.join('  '));
    }

    return this;
  };

  this.indent = function() {
    indent.push('');
    return this;
  };

  this.unindent = function() {
    indent.pop();
    return this;
  };
}

/**
 * A writer for meta-model backed document trees
 *
 * @class XMLWriter
 */
function XMLWriter(options) {

  options = _.extend({ format: false, preamble: true }, options || {});

  function toXML(tree, writer) {
    var internalWriter = writer || new SavingWriter();
    var formatingWriter = new FormatingWriter(internalWriter, options.format);

    if (options.preamble) {
      formatingWriter.append(XML_PREAMBLE);
    }

    new ElementSerializer().build(tree).serializeTo(formatingWriter);

    if (!writer) {
      return internalWriter.value;
    }
  }

  return {
    toXML: toXML
  };
}

module.exports = XMLWriter;
},{}],43:[function(_dereq_,module,exports){
/**
 * Tiny stack for browser or server
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tiny-stack/master/LICENSE>
 * @link http://avoidwork.github.io/tiny-stack
 * @module tiny-stack
 * @version 0.1.0
 */

( function ( global ) {

"use strict";

/**
 * TinyStack
 *
 * @constructor
 */
function TinyStack () {
	this.data = [null];
	this.top  = 0;
}

/**
 * Clears the stack
 *
 * @method clear
 * @memberOf TinyStack
 * @return {Object} {@link TinyStack}
 */
TinyStack.prototype.clear = function clear () {
	this.data = [null];
	this.top  = 0;

	return this;
};

/**
 * Gets the size of the stack
 *
 * @method length
 * @memberOf TinyStack
 * @return {Number} Size of stack
 */
TinyStack.prototype.length = function length () {
	return this.top;
};

/**
 * Gets the item at the top of the stack
 *
 * @method peek
 * @memberOf TinyStack
 * @return {Mixed} Item at the top of the stack
 */
TinyStack.prototype.peek = function peek () {
	return this.data[this.top];
};

/**
 * Gets & removes the item at the top of the stack
 *
 * @method pop
 * @memberOf TinyStack
 * @return {Mixed} Item at the top of the stack
 */
TinyStack.prototype.pop = function pop () {
	if ( this.top > 0 ) {
		this.top--;

		return this.data.pop();
	}
	else {
		return undefined;
	}
};

/**
 * Pushes an item onto the stack
 *
 * @method push
 * @memberOf TinyStack
 * @return {Object} {@link TinyStack}
 */
TinyStack.prototype.push = function push ( arg ) {
	this.data[++this.top] = arg;

	return this;
};

/**
 * TinyStack factory
 *
 * @method factory
 * @return {Object} {@link TinyStack}
 */
function factory () {
	return new TinyStack();
}

// Node, AMD & window supported
if ( typeof exports != "undefined" ) {
	module.exports = factory;
}
else if ( typeof define == "function" ) {
	define( function () {
		return factory;
	} );
}
else {
	global.stack = factory;
}
} )( this );

},{}],44:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_(48);

module.exports.types = _dereq_(52);

module.exports.ns = _dereq_(49);
},{}],45:[function(_dereq_,module,exports){
'use strict';

function Base() { }

Base.prototype.get = function(name) {
  return this.$model.properties.get(this, name);
};

Base.prototype.set = function(name, value) {
  this.$model.properties.set(this, name, value);
};


module.exports = Base;
},{}],46:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var parseNameNs = _dereq_(49).parseName;


function DescriptorBuilder(nameNs) {
  this.ns = nameNs;
  this.name = nameNs.name;
  this.allTypes = [];
  this.properties = [];
  this.propertiesByName = {};
}

module.exports = DescriptorBuilder;


DescriptorBuilder.prototype.build = function() {
  return _.pick(this, [ 'ns', 'name', 'allTypes', 'properties', 'propertiesByName', 'bodyProperty' ]);
};

DescriptorBuilder.prototype.addProperty = function(p, idx) {
  this.addNamedProperty(p, true);

  var properties = this.properties;

  if (idx !== undefined) {
    properties.splice(idx, 0, p);
  } else {
    properties.push(p);
  }
};


DescriptorBuilder.prototype.replaceProperty = function(oldProperty, newProperty) {
  var oldNameNs = oldProperty.ns;

  var props = this.properties,
      propertiesByName = this.propertiesByName;

  if (oldProperty.isBody) {

    if (!newProperty.isBody) {
      throw new Error(
        'property <' + newProperty.ns.name + '> must be body property ' +
        'to refine <' + oldProperty.ns.name + '>');
    }

    // TODO: Check compatibility
    this.setBodyProperty(newProperty, false);
  }

  this.addNamedProperty(newProperty, true);

  // replace old property at index with new one
  var idx = props.indexOf(oldProperty);
  if (idx === -1) {
    throw new Error('property <' + oldNameNs.name + '> not found in property list');
  }

  props[idx] = newProperty;

  // replace propertiesByName entry with new property
  propertiesByName[oldNameNs.name] = propertiesByName[oldNameNs.localName] = newProperty;
};


DescriptorBuilder.prototype.redefineProperty = function(p) {

  var nsPrefix = p.ns.prefix;
  var parts = p.redefines.split('#');

  var name = parseNameNs(parts[0], nsPrefix);
  var attrName = parseNameNs(parts[1], name.prefix).name;

  var redefinedProperty = this.propertiesByName[attrName];
  if (!redefinedProperty) {
    throw new Error('refined property <' + attrName + '> not found');
  } else {
    this.replaceProperty(redefinedProperty, p);
  }

  delete p.redefines;
};

DescriptorBuilder.prototype.addNamedProperty = function(p, validate) {
  var ns = p.ns,
      propsByName = this.propertiesByName;

  if (validate) {
    this.assertNotDefined(p, ns.name);
    this.assertNotDefined(p, ns.localName);
  }

  propsByName[ns.name] = propsByName[ns.localName] = p;
};

DescriptorBuilder.prototype.removeNamedProperty = function(p) {
  var ns = p.ns,
      propsByName = this.propertiesByName;

  delete propsByName[ns.name];
  delete propsByName[ns.localName];
};

DescriptorBuilder.prototype.setBodyProperty = function(p, validate) {

  if (validate && this.bodyProperty) {
    throw new Error(
      'body property defined multiple times ' +
      '(<' + this.bodyProperty.ns.name + '>, <' + p.ns.name + '>)');
  }

  this.bodyProperty = p;
};

DescriptorBuilder.prototype.addIdProperty = function(name) {
  var nameNs = parseNameNs(name, this.ns.prefix);

  var p = {
    name: nameNs.localName,
    type: 'String',
    isAttr: true,
    ns: nameNs
  };

  // ensure that id is always the first attribute (if present)
  this.addProperty(p, 0);
};

DescriptorBuilder.prototype.assertNotDefined = function(p, name) {
  var propertyName = p.name,
      definedProperty = this.propertiesByName[propertyName];

  if (definedProperty) {
    throw new Error(
      'property <' + propertyName + '> already defined; ' +
      'override of <' + definedProperty.definedBy.ns.name + '#' + definedProperty.ns.name + '> by ' +
      '<' + p.definedBy.ns.name + '#' + p.ns.name + '> not allowed without redefines');
  }
};

DescriptorBuilder.prototype.hasProperty = function(name) {
  return this.propertiesByName[name];
};

DescriptorBuilder.prototype.addTrait = function(t) {

  var allTypes = this.allTypes;

  if (allTypes.indexOf(t) !== -1) {
    return;
  }

  _.forEach(t.properties, function(p) {

    // clone property to allow extensions
    p = _.extend({}, p, {
      name: p.ns.localName
    });

    Object.defineProperty(p, 'definedBy', {
      value: t
    });

    // add redefine support
    if (p.redefines) {
      this.redefineProperty(p);
    } else {
      if (p.isBody) {
        this.setBodyProperty(p);
      }
      this.addProperty(p);
    }
  }, this);

  allTypes.push(t);
};

},{}],47:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Base = _dereq_(45);


function Factory(model, properties) {
  this.model = model;
  this.properties = properties;
}

module.exports = Factory;


Factory.prototype.createType = function(descriptor) {

  var model = this.model;

  var props = this.properties,
      prototype = Object.create(Base.prototype);

  // initialize default values
  _.forEach(descriptor.properties, function(p) {
    if (!p.isMany && p.default !== undefined) {
      prototype[p.name] = p.default;
    }
  });

  props.defineModel(prototype, model);
  props.defineDescriptor(prototype, descriptor);

  var name = descriptor.ns.name;

  /**
   * The new type constructor
   */
  function ModdleElement(attrs) {
    props.define(this, '$type', { value: name, enumerable: true });
    props.define(this, '$attrs', { value: {} });
    props.define(this, '$parent', { writable: true });

    _.forEach(attrs, function(val, key) {
      this.set(key, val);
    }, this);
  }

  ModdleElement.prototype = prototype;

  ModdleElement.hasType = prototype.$instanceOf = this.model.hasType;

  // static links
  props.defineModel(ModdleElement, model);
  props.defineDescriptor(ModdleElement, descriptor);

  return ModdleElement;
};
},{}],48:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Factory = _dereq_(47),
    Registry = _dereq_(51),
    Properties = _dereq_(50);

var parseNameNs = _dereq_(49).parseName;


//// Moddle implementation /////////////////////////////////////////////////

/**
 * @class Moddle
 *
 * A model that can be used to create elements of a specific type.
 *
 * @example
 *
 * var Moddle = require('moddle');
 *
 * var pkg = {
 *   name: 'mypackage',
 *   prefix: 'my',
 *   types: [
 *     { name: 'Root' }
 *   ]
 * };
 *
 * var moddle = new Moddle([pkg]);
 *
 * @param {Array<Package>} packages  the packages to contain
 * @param {Object} options  additional options to pass to the model
 */
function Moddle(packages, options) {

  options = options || {};

  this.properties = new Properties(this);

  this.factory = new Factory(this, this.properties);
  this.registry = new Registry(packages, this.properties, options);

  this.typeCache = {};
}

module.exports = Moddle;


/**
 * Create an instance of the specified type.
 *
 * @method Moddle#create
 *
 * @example
 *
 * var foo = moddle.create('my:Foo');
 * var bar = moddle.create('my:Bar', { id: 'BAR_1' });
 *
 * @param  {String|Object} descriptor the type descriptor or name know to the model
 * @param  {Object} attrs   a number of attributes to initialize the model instance with
 * @return {Object}         model instance
 */
Moddle.prototype.create = function(descriptor, attrs) {
  var Type = this.getType(descriptor);

  if (!Type) {
    throw new Error('unknown type <' + descriptor + '>');
  }

  return new Type(attrs);
};


/**
 * Returns the type representing a given descriptor
 *
 * @method Moddle#getType
 *
 * @example
 *
 * var Foo = moddle.getType('my:Foo');
 * var foo = new Foo({ 'id' : 'FOO_1' });
 *
 * @param  {String|Object} descriptor the type descriptor or name know to the model
 * @return {Object}         the type representing the descriptor
 */
Moddle.prototype.getType = function(descriptor) {

  var cache = this.typeCache;

  var name = _.isString(descriptor) ? descriptor : descriptor.ns.name;

  var type = cache[name];

  if (!type) {
    descriptor = this.registry.getEffectiveDescriptor(name);
    type = cache[descriptor.name] = this.factory.createType(descriptor);
  }

  return type;
};


/**
 * Creates an any-element type to be used within model instances.
 *
 * This can be used to create custom elements that lie outside the meta-model.
 * The created element contains all the meta-data required to serialize it
 * as part of meta-model elements.
 *
 * @method Moddle#createAny
 *
 * @example
 *
 * var foo = moddle.createAny('vendor:Foo', 'http://vendor', {
 *   value: 'bar'
 * });
 *
 * var container = moddle.create('my:Container', 'http://my', {
 *   any: [ foo ]
 * });
 *
 * // go ahead and serialize the stuff
 *
 *
 * @param  {String} name  the name of the element
 * @param  {String} nsUri the namespace uri of the element
 * @param  {Object} [properties] a map of properties to initialize the instance with
 * @return {Object} the any type instance
 */
Moddle.prototype.createAny = function(name, nsUri, properties) {

  var nameNs = parseNameNs(name);

  var element = {
    $type: name
  };

  var descriptor = {
    name: name,
    isGeneric: true,
    ns: {
      prefix: nameNs.prefix,
      localName: nameNs.localName,
      uri: nsUri
    }
  };

  this.properties.defineDescriptor(element, descriptor);
  this.properties.defineModel(element, this);
  this.properties.define(element, '$parent', { enumerable: false, writable: true });

  _.forEach(properties, function(a, key) {
    if (_.isObject(a) && a.value !== undefined) {
      element[a.name] = a.value;
    } else {
      element[key] = a;
    }
  });

  return element;
};

/**
 * Returns a registered package by uri or prefix
 *
 * @return {Object} the package
 */
Moddle.prototype.getPackage = function(uriOrPrefix) {
  return this.registry.getPackage(uriOrPrefix);
};

/**
 * Returns a snapshot of all known packages
 *
 * @return {Object} the package
 */
Moddle.prototype.getPackages = function() {
  return this.registry.getPackages();
};

/**
 * Returns the descriptor for an element
 */
Moddle.prototype.getElementDescriptor = function(element) {
  return element.$descriptor;
};

/**
 * Returns true if the given descriptor or instance
 * represents the given type.
 *
 * May be applied to this, if element is omitted.
 */
Moddle.prototype.hasType = function(element, type) {
  if (type === undefined) {
    type = element;
    element = this;
  }

  var descriptor = element.$model.getElementDescriptor(element);

  return !!_.find(descriptor.allTypes, function(t) {
    return t.name === type;
  });
};


/**
 * Returns the descriptor of an elements named property
 */
Moddle.prototype.getPropertyDescriptor = function(element, property) {
  return this.getElementDescriptor(element).propertiesByName[property];
};

},{}],49:[function(_dereq_,module,exports){
'use strict';

/**
 * Parses a namespaced attribute name of the form (ns:)localName to an object,
 * given a default prefix to assume in case no explicit namespace is given.
 *
 * @param {String} name
 * @param {String} [defaultPrefix] the default prefix to take, if none is present.
 *
 * @return {Object} the parsed name
 */
module.exports.parseName = function(name, defaultPrefix) {
  var parts = name.split(/:/),
      localName, prefix;

  // no prefix (i.e. only local name)
  if (parts.length === 1) {
    localName = name;
    prefix = defaultPrefix;
  } else
  // prefix + local name
  if (parts.length === 2) {
    localName = parts[1];
    prefix = parts[0];
  } else {
    throw new Error('expected <prefix:localName> or <localName>, got ' + name);
  }

  name = (prefix ? prefix + ':' : '') + localName;

  return {
    name: name,
    prefix: prefix,
    localName: localName
  };
};
},{}],50:[function(_dereq_,module,exports){
'use strict';


/**
 * A utility that gets and sets properties of model elements.
 *
 * @param {Model} model
 */
function Properties(model) {
  this.model = model;
}

module.exports = Properties;


/**
 * Sets a named property on the target element
 *
 * @param {Object} target
 * @param {String} name
 * @param {Object} value
 */
Properties.prototype.set = function(target, name, value) {

  var property = this.model.getPropertyDescriptor(target, name);

  if (!property) {
    target.$attrs[name] = value;
  } else {
    Object.defineProperty(target, property.name, {
      enumerable: !property.isReference,
      writable: true,
      value: value
    });
  }
};

/**
 * Returns the named property of the given element
 *
 * @param  {Object} target
 * @param  {String} name
 *
 * @return {Object}
 */
Properties.prototype.get = function(target, name) {

  var property = this.model.getPropertyDescriptor(target, name);

  if (!property) {
    return target.$attrs[name];
  }

  var propertyName = property.name;

  // check if access to collection property and lazily initialize it
  if (!target[propertyName] && property.isMany) {
    Object.defineProperty(target, propertyName, {
      enumerable: !property.isReference,
      writable: true,
      value: []
    });
  }

  return target[propertyName];
};


/**
 * Define a property on the target element
 *
 * @param  {Object} target
 * @param  {String} name
 * @param  {Object} options
 */
Properties.prototype.define = function(target, name, options) {
  Object.defineProperty(target, name, options);
};


/**
 * Define the descriptor for an element
 */
Properties.prototype.defineDescriptor = function(target, descriptor) {
  this.define(target, '$descriptor', { value: descriptor });
};

/**
 * Define the model for an element
 */
Properties.prototype.defineModel = function(target, model) {
  this.define(target, '$model', { value: model });
};
},{}],51:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Types = _dereq_(52),
    DescriptorBuilder = _dereq_(46);

var parseNameNs = _dereq_(49).parseName;


function Registry(packages, properties, options) {
  this.options = _.extend({ generateId: 'id' }, options || {});

  this.packageMap = {};
  this.typeMap = {};

  this.packages = [];

  this.properties = properties;

  _.forEach(packages, this.registerPackage, this);
}

module.exports = Registry;


Registry.prototype.getPackage = function(uriOrPrefix) {
  return this.packageMap[uriOrPrefix];
};

Registry.prototype.getPackages = function() {
  return this.packages;
};


Registry.prototype.registerPackage = function(pkg) {

  // register types
  _.forEach(pkg.types, function(descriptor) {
    this.registerType(descriptor, pkg);
  }, this);

  this.packageMap[pkg.uri] = this.packageMap[pkg.prefix] = pkg;
  this.packages.push(pkg);
};


/**
 * Register a type from a specific package with us
 */
Registry.prototype.registerType = function(type, pkg) {

  var ns = parseNameNs(type.name, pkg.prefix),
      name = ns.name,
      propertiesByName = {};

  // parse properties
  _.forEach(type.properties, function(p) {

    // namespace property names
    var propertyNs = parseNameNs(p.name, ns.prefix),
        propertyName = propertyNs.name;

    // namespace property types
    if (!Types.isBuiltIn(p.type)) {
      p.type = parseNameNs(p.type, propertyNs.prefix).name;
    }

    _.extend(p, {
      ns: propertyNs,
      name: propertyName
    });

    propertiesByName[propertyName] = p;
  });

  // update ns + name
  _.extend(type, {
    ns: ns,
    name: name,
    propertiesByName: propertiesByName
  });

  // link to package
  this.definePackage(type, pkg);

  // register
  this.typeMap[name] = type;
};


/**
 * Traverse the type hierarchy from bottom to top.
 */
Registry.prototype.mapTypes = function(nsName, iterator) {

  var type = this.typeMap[nsName.name];

  if (!type) {
    throw new Error('unknown type <' + nsName.name + '>');
  }

  _.forEach(type.superClass, function(cls) {
    var parentNs = parseNameNs(cls, nsName.prefix);
    this.mapTypes(parentNs, iterator);
  }, this);

  iterator(type);
};


/**
 * Returns the effective descriptor for a type.
 *
 * @param  {String} type the namespaced name (ns:localName) of the type
 *
 * @return {Descriptor} the resulting effective descriptor
 */
Registry.prototype.getEffectiveDescriptor = function(name) {

  var nsName = parseNameNs(name);

  var builder = new DescriptorBuilder(nsName);

  this.mapTypes(nsName, function(type) {
    builder.addTrait(type);
  });

  // check we have an id assigned
  var id = this.options.generateId;
  if (id && !builder.hasProperty(id)) {
    builder.addIdProperty(id);
  }

  var descriptor = builder.build();

  // define package link
  this.definePackage(descriptor, descriptor.allTypes[descriptor.allTypes.length - 1].$pkg);

  return descriptor;
};


Registry.prototype.definePackage = function(target, pkg) {
  this.properties.define(target, '$pkg', { value: pkg });
};
},{}],52:[function(_dereq_,module,exports){
'use strict';

/**
 * Built-in moddle types
 */
var BUILTINS = {
  String: true,
  Boolean: true,
  Integer: true,
  Real: true,
  Element: true,
};

/**
 * Converters for built in types from string representations
 */
var TYPE_CONVERTERS = {
  String: function(s) { return s; },
  Boolean: function(s) { return s === 'true'; },
  Integer: function(s) { return parseInt(s, 10); },
  Real: function(s) { return parseFloat(s, 10); }
};

/**
 * Convert a type to its real representation
 */
module.exports.coerceType = function(type, value) {

  var converter = TYPE_CONVERTERS[type];

  if (converter) {
    return converter(value);
  } else {
    return value;
  }
};

/**
 * Return whether the given type is built-in
 */
module.exports.isBuiltIn = function(type) {
  return !!BUILTINS[type];
};

/**
 * Return whether the given type is simple
 */
module.exports.isSimple = function(type) {
  return !!TYPE_CONVERTERS[type];
};
},{}],53:[function(_dereq_,module,exports){
module.exports={
  "name": "BPMN20",
  "uri": "http://www.omg.org/spec/BPMN/20100524/MODEL",
  "associations": [],
  "types": [
    {
      "name": "Interface",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "operations",
          "type": "Operation",
          "isMany": true
        },
        {
          "name": "implementationRef",
          "type": "String",
          "isAttr": true
        }
      ]
    },
    {
      "name": "Operation",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "inMessageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "outMessageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "errorRefs",
          "type": "Error",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "implementationRef",
          "type": "String",
          "isAttr": true
        }
      ]
    },
    {
      "name": "EndPoint",
      "superClass": [
        "RootElement"
      ]
    },
    {
      "name": "Auditing",
      "superClass": [
        "BaseElement"
      ]
    },
    {
      "name": "GlobalTask",
      "superClass": [
        "CallableElement"
      ],
      "properties": [
        {
          "name": "resources",
          "type": "ResourceRole",
          "isMany": true
        }
      ]
    },
    {
      "name": "Monitoring",
      "superClass": [
        "BaseElement"
      ]
    },
    {
      "name": "Performer",
      "superClass": [
        "ResourceRole"
      ]
    },
    {
      "name": "Process",
      "superClass": [
        "FlowElementsContainer",
        "CallableElement"
      ],
      "properties": [
        {
          "name": "processType",
          "type": "ProcessType",
          "isAttr": true
        },
        {
          "name": "isClosed",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "auditing",
          "type": "Auditing"
        },
        {
          "name": "monitoring",
          "type": "Monitoring"
        },
        {
          "name": "properties",
          "type": "Property",
          "isMany": true
        },
        {
          "name": "supports",
          "type": "Process",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "definitionalCollaborationRef",
          "type": "Collaboration",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "isExecutable",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "resources",
          "type": "ResourceRole",
          "isMany": true
        },
        {
          "name": "artifacts",
          "type": "Artifact",
          "isMany": true
        },
        {
          "name": "correlationSubscriptions",
          "type": "CorrelationSubscription",
          "isMany": true
        }
      ]
    },
    {
      "name": "LaneSet",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "lanes",
          "type": "Lane",
          "isMany": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Lane",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "childLaneSet",
          "type": "LaneSet",
          "serialize": "xsi:type"
        },
        {
          "name": "partitionElementRef",
          "type": "BaseElement",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "flowNodeRef",
          "type": "FlowNode",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "partitionElement",
          "type": "BaseElement"
        }
      ]
    },
    {
      "name": "GlobalManualTask",
      "superClass": [
        "GlobalTask"
      ]
    },
    {
      "name": "ManualTask",
      "superClass": [
        "Task"
      ]
    },
    {
      "name": "UserTask",
      "superClass": [
        "Task"
      ],
      "properties": [
        {
          "name": "renderings",
          "type": "Rendering",
          "isMany": true
        },
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Rendering",
      "superClass": [
        "BaseElement"
      ]
    },
    {
      "name": "HumanPerformer",
      "superClass": [
        "Performer"
      ]
    },
    {
      "name": "PotentialOwner",
      "superClass": [
        "HumanPerformer"
      ]
    },
    {
      "name": "GlobalUserTask",
      "superClass": [
        "GlobalTask"
      ],
      "properties": [
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "renderings",
          "type": "Rendering",
          "isMany": true
        }
      ]
    },
    {
      "name": "Gateway",
      "isAbstract": true,
      "superClass": [
        "FlowNode"
      ],
      "properties": [
        {
          "name": "gatewayDirection",
          "type": "GatewayDirection",
          "default": "Unspecified",
          "isAttr": true
        }
      ]
    },
    {
      "name": "EventBasedGateway",
      "superClass": [
        "Gateway"
      ],
      "properties": [
        {
          "name": "instantiate",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "eventGatewayType",
          "type": "EventBasedGatewayType",
          "isAttr": true,
          "default": "Exclusive"
        }
      ]
    },
    {
      "name": "ComplexGateway",
      "superClass": [
        "Gateway"
      ],
      "properties": [
        {
          "name": "activationCondition",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "default",
          "type": "SequenceFlow",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ExclusiveGateway",
      "superClass": [
        "Gateway"
      ],
      "properties": [
        {
          "name": "default",
          "type": "SequenceFlow",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "InclusiveGateway",
      "superClass": [
        "Gateway"
      ],
      "properties": [
        {
          "name": "default",
          "type": "SequenceFlow",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ParallelGateway",
      "superClass": [
        "Gateway"
      ]
    },
    {
      "name": "RootElement",
      "isAbstract": true,
      "superClass": [
        "BaseElement"
      ]
    },
    {
      "name": "Relationship",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "type",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "direction",
          "type": "RelationshipDirection",
          "isAttr": true
        },
        {
          "name": "sources",
          "isMany": true,
          "isReference": true,
          "type": "Element"
        },
        {
          "name": "targets",
          "isMany": true,
          "isReference": true,
          "type": "Element"
        }
      ]
    },
    {
      "name": "BaseElement",
      "isAbstract": true,
      "properties": [
        {
          "name": "id",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "extensionDefinitions",
          "type": "ExtensionDefinition",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "extensionElements",
          "type": "ExtensionElements"
        },
        {
          "name": "documentation",
          "type": "Documentation",
          "isMany": true
        }
      ]
    },
    {
      "name": "Extension",
      "properties": [
        {
          "name": "mustUnderstand",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "definition",
          "type": "ExtensionDefinition"
        }
      ]
    },
    {
      "name": "ExtensionDefinition",
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "extensionAttributeDefinitions",
          "type": "ExtensionAttributeDefinition",
          "isMany": true
        }
      ]
    },
    {
      "name": "ExtensionAttributeDefinition",
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "type",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "isReference",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "extensionDefinition",
          "type": "ExtensionDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ExtensionElements",
      "properties": [
        {
          "name": "valueRef",
          "isAttr": true,
          "isReference": true,
          "type": "Element"
        },
        {
          "name": "values",
          "type": "Element",
          "isMany": true
        },
        {
          "name": "extensionAttributeDefinition",
          "type": "ExtensionAttributeDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Documentation",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "text",
          "type": "String",
          "isBody": true
        },
        {
          "name": "textFormat",
          "default": "text/plain",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Event",
      "isAbstract": true,
      "superClass": [
        "FlowNode",
        "InteractionNode"
      ],
      "properties": [
        {
          "name": "properties",
          "type": "Property",
          "isMany": true
        }
      ]
    },
    {
      "name": "IntermediateCatchEvent",
      "superClass": [
        "CatchEvent"
      ]
    },
    {
      "name": "IntermediateThrowEvent",
      "superClass": [
        "ThrowEvent"
      ]
    },
    {
      "name": "EndEvent",
      "superClass": [
        "ThrowEvent"
      ]
    },
    {
      "name": "StartEvent",
      "superClass": [
        "CatchEvent"
      ],
      "properties": [
        {
          "name": "isInterrupting",
          "default": true,
          "isAttr": true,
          "type": "Boolean"
        }
      ]
    },
    {
      "name": "ThrowEvent",
      "isAbstract": true,
      "superClass": [
        "Event"
      ],
      "properties": [
        {
          "name": "inputSet",
          "type": "InputSet"
        },
        {
          "name": "eventDefinitionRefs",
          "type": "EventDefinition",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "dataInputAssociation",
          "type": "DataInputAssociation",
          "isMany": true
        },
        {
          "name": "dataInputs",
          "type": "DataInput",
          "isMany": true
        },
        {
          "name": "eventDefinitions",
          "type": "EventDefinition",
          "isMany": true
        }
      ]
    },
    {
      "name": "CatchEvent",
      "isAbstract": true,
      "superClass": [
        "Event"
      ],
      "properties": [
        {
          "name": "parallelMultiple",
          "isAttr": true,
          "type": "Boolean",
          "default": false
        },
        {
          "name": "outputSet",
          "type": "OutputSet"
        },
        {
          "name": "eventDefinitionRefs",
          "type": "EventDefinition",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "dataOutputAssociation",
          "type": "DataOutputAssociation",
          "isMany": true
        },
        {
          "name": "dataOutputs",
          "type": "DataOutput",
          "isMany": true
        },
        {
          "name": "eventDefinitions",
          "type": "EventDefinition",
          "isMany": true
        }
      ]
    },
    {
      "name": "BoundaryEvent",
      "superClass": [
        "CatchEvent"
      ],
      "properties": [
        {
          "name": "cancelActivity",
          "default": true,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "attachedToRef",
          "type": "Activity",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "EventDefinition",
      "isAbstract": true,
      "superClass": [
        "RootElement"
      ]
    },
    {
      "name": "CancelEventDefinition",
      "superClass": [
        "EventDefinition"
      ]
    },
    {
      "name": "ErrorEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "errorRef",
          "type": "Error",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "TerminateEventDefinition",
      "superClass": [
        "EventDefinition"
      ]
    },
    {
      "name": "EscalationEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "escalationRef",
          "type": "Escalation",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Escalation",
      "properties": [
        {
          "name": "structureRef",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "escalationCode",
          "isAttr": true,
          "type": "String"
        }
      ],
      "superClass": [
        "RootElement"
      ]
    },
    {
      "name": "CompensateEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "waitForCompletion",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "activityRef",
          "type": "Activity",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "TimerEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "timeDate",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "timeCycle",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "timeDuration",
          "type": "Expression",
          "serialize": "xsi:type"
        }
      ]
    },
    {
      "name": "LinkEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "target",
          "type": "LinkEventDefinition",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "source",
          "type": "LinkEventDefinition",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "MessageEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "messageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "operationRef",
          "type": "Operation",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ConditionalEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "condition",
          "type": "Expression",
          "serialize": "xsi:type"
        }
      ]
    },
    {
      "name": "SignalEventDefinition",
      "superClass": [
        "EventDefinition"
      ],
      "properties": [
        {
          "name": "signalRef",
          "type": "Signal",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Signal",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "structureRef",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "ImplicitThrowEvent",
      "superClass": [
        "ThrowEvent"
      ]
    },
    {
      "name": "DataState",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "ItemAwareElement",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "itemSubjectRef",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "dataState",
          "type": "DataState"
        }
      ]
    },
    {
      "name": "DataAssociation",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "transformation",
          "type": "FormalExpression"
        },
        {
          "name": "assignment",
          "type": "Assignment",
          "isMany": true
        },
        {
          "name": "sourceRef",
          "type": "ItemAwareElement",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "targetRef",
          "type": "ItemAwareElement",
          "isReference": true
        }
      ]
    },
    {
      "name": "DataInput",
      "superClass": [
        "ItemAwareElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "isCollection",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "inputSetRefs",
          "type": "InputSet",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        },
        {
          "name": "inputSetWithOptional",
          "type": "InputSet",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        },
        {
          "name": "inputSetWithWhileExecuting",
          "type": "InputSet",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "DataOutput",
      "superClass": [
        "ItemAwareElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "isCollection",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "outputSetRefs",
          "type": "OutputSet",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        },
        {
          "name": "outputSetWithOptional",
          "type": "OutputSet",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        },
        {
          "name": "outputSetWithWhileExecuting",
          "type": "OutputSet",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "InputSet",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "dataInputRefs",
          "type": "DataInput",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "optionalInputRefs",
          "type": "DataInput",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "whileExecutingInputRefs",
          "type": "DataInput",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "outputSetRefs",
          "type": "OutputSet",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "OutputSet",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "dataOutputRefs",
          "type": "DataOutput",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "inputSetRefs",
          "type": "InputSet",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "optionalOutputRefs",
          "type": "DataOutput",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "whileExecutingOutputRefs",
          "type": "DataOutput",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Property",
      "superClass": [
        "ItemAwareElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "DataInputAssociation",
      "superClass": [
        "DataAssociation"
      ]
    },
    {
      "name": "DataOutputAssociation",
      "superClass": [
        "DataAssociation"
      ]
    },
    {
      "name": "InputOutputSpecification",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "inputSets",
          "type": "InputSet",
          "isMany": true
        },
        {
          "name": "outputSets",
          "type": "OutputSet",
          "isMany": true
        },
        {
          "name": "dataInputs",
          "type": "DataInput",
          "isMany": true
        },
        {
          "name": "dataOutputs",
          "type": "DataOutput",
          "isMany": true
        }
      ]
    },
    {
      "name": "DataObject",
      "superClass": [
        "FlowElement",
        "ItemAwareElement"
      ],
      "properties": [
        {
          "name": "isCollection",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        }
      ]
    },
    {
      "name": "InputOutputBinding",
      "properties": [
        {
          "name": "inputDataRef",
          "type": "InputSet",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "outputDataRef",
          "type": "OutputSet",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "operationRef",
          "type": "Operation",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Assignment",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "from",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "to",
          "type": "Expression",
          "serialize": "xsi:type"
        }
      ]
    },
    {
      "name": "DataStore",
      "superClass": [
        "RootElement",
        "ItemAwareElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "capacity",
          "isAttr": true,
          "type": "Integer"
        },
        {
          "name": "isUnlimited",
          "default": true,
          "isAttr": true,
          "type": "Boolean"
        }
      ]
    },
    {
      "name": "DataStoreReference",
      "superClass": [
        "ItemAwareElement",
        "FlowElement"
      ],
      "properties": [
        {
          "name": "dataStoreRef",
          "type": "DataStore",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "DataObjectReference",
      "superClass": [
        "ItemAwareElement",
        "FlowElement"
      ],
      "properties": [
        {
          "name": "dataObjectRef",
          "type": "DataObject",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ConversationLink",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "sourceRef",
          "type": "InteractionNode",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "targetRef",
          "type": "InteractionNode",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "ConversationAssociation",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "innerConversationNodeRef",
          "type": "ConversationNode",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "outerConversationNodeRef",
          "type": "ConversationNode",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "CallConversation",
      "superClass": [
        "ConversationNode"
      ],
      "properties": [
        {
          "name": "calledCollaborationRef",
          "type": "Collaboration",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "participantAssociations",
          "type": "ParticipantAssociation",
          "isMany": true
        }
      ]
    },
    {
      "name": "Conversation",
      "superClass": [
        "ConversationNode"
      ]
    },
    {
      "name": "SubConversation",
      "superClass": [
        "ConversationNode"
      ],
      "properties": [
        {
          "name": "conversationNodes",
          "type": "ConversationNode",
          "isMany": true
        }
      ]
    },
    {
      "name": "ConversationNode",
      "isAbstract": true,
      "superClass": [
        "InteractionNode",
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "participantRefs",
          "type": "Participant",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "messageFlowRefs",
          "type": "MessageFlow",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "correlationKeys",
          "type": "CorrelationKey",
          "isMany": true
        }
      ]
    },
    {
      "name": "GlobalConversation",
      "superClass": [
        "Collaboration"
      ]
    },
    {
      "name": "PartnerEntity",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "participantRef",
          "type": "Participant",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "PartnerRole",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "participantRef",
          "type": "Participant",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "CorrelationProperty",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "correlationPropertyRetrievalExpression",
          "type": "CorrelationPropertyRetrievalExpression",
          "isMany": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "type",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Error",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "structureRef",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "errorCode",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "CorrelationKey",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "correlationPropertyRef",
          "type": "CorrelationProperty",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Expression",
      "superClass": [
        "BaseElement"
      ],
      "isAbstract": true
    },
    {
      "name": "FormalExpression",
      "superClass": [
        "Expression"
      ],
      "properties": [
        {
          "name": "language",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "body",
          "type": "String",
          "isBody": true
        },
        {
          "name": "evaluatesToTypeRef",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Message",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "itemRef",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ItemDefinition",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "itemKind",
          "type": "ItemKind",
          "isAttr": true
        },
        {
          "name": "structureRef",
          "type": "String",
          "isAttr": true
        },
        {
          "name": "isCollection",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "import",
          "type": "Import",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "FlowElement",
      "isAbstract": true,
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "auditing",
          "type": "Auditing"
        },
        {
          "name": "monitoring",
          "type": "Monitoring"
        },
        {
          "name": "categoryValueRef",
          "type": "CategoryValue",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "SequenceFlow",
      "superClass": [
        "FlowElement"
      ],
      "properties": [
        {
          "name": "isImmediate",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "conditionExpression",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "sourceRef",
          "type": "FlowNode",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "targetRef",
          "type": "FlowNode",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "FlowElementsContainer",
      "isAbstract": true,
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "laneSets",
          "type": "LaneSet",
          "isMany": true
        },
        {
          "name": "flowElements",
          "type": "FlowElement",
          "isMany": true
        }
      ]
    },
    {
      "name": "CallableElement",
      "isAbstract": true,
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "ioSpecification",
          "type": "InputOutputSpecification"
        },
        {
          "name": "supportedInterfaceRefs",
          "type": "Interface",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "ioBinding",
          "type": "InputOutputBinding",
          "isMany": true
        }
      ]
    },
    {
      "name": "FlowNode",
      "isAbstract": true,
      "superClass": [
        "FlowElement"
      ],
      "properties": [
        {
          "name": "incoming",
          "type": "SequenceFlow",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "outgoing",
          "type": "SequenceFlow",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "lanes",
          "type": "Lane",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "CorrelationPropertyRetrievalExpression",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "messagePath",
          "type": "FormalExpression"
        },
        {
          "name": "messageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "CorrelationPropertyBinding",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "dataPath",
          "type": "FormalExpression"
        },
        {
          "name": "correlationPropertyRef",
          "type": "CorrelationProperty",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Resource",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "resourceParameters",
          "type": "ResourceParameter",
          "isMany": true
        }
      ]
    },
    {
      "name": "ResourceParameter",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "isRequired",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "type",
          "type": "ItemDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "CorrelationSubscription",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "correlationKeyRef",
          "type": "CorrelationKey",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "correlationPropertyBinding",
          "type": "CorrelationPropertyBinding",
          "isMany": true
        }
      ]
    },
    {
      "name": "MessageFlow",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "sourceRef",
          "type": "InteractionNode",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "targetRef",
          "type": "InteractionNode",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "messageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "MessageFlowAssociation",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "innerMessageFlowRef",
          "type": "MessageFlow",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "outerMessageFlowRef",
          "type": "MessageFlow",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "InteractionNode",
      "isAbstract": true,
      "properties": [
        {
          "name": "incomingConversationLinks",
          "type": "ConversationLink",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        },
        {
          "name": "outgoingConversationLinks",
          "type": "ConversationLink",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Participant",
      "superClass": [
        "InteractionNode",
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "interfaceRefs",
          "type": "Interface",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "participantMultiplicity",
          "type": "ParticipantMultiplicity"
        },
        {
          "name": "endPointRefs",
          "type": "EndPoint",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "processRef",
          "type": "Process",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ParticipantAssociation",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "innerParticipantRef",
          "type": "Participant",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "outerParticipantRef",
          "type": "Participant",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ParticipantMultiplicity",
      "properties": [
        {
          "name": "minimum",
          "default": 0,
          "isAttr": true,
          "type": "Integer"
        },
        {
          "name": "maximum",
          "default": 1,
          "isAttr": true,
          "type": "Integer"
        }
      ]
    },
    {
      "name": "Collaboration",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "isClosed",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "choreographyRef",
          "type": "Choreography",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "artifacts",
          "type": "Artifact",
          "isMany": true
        },
        {
          "name": "participantAssociations",
          "type": "ParticipantAssociation",
          "isMany": true
        },
        {
          "name": "messageFlowAssociations",
          "type": "MessageFlowAssociation",
          "isMany": true
        },
        {
          "name": "conversationAssociations",
          "type": "ConversationAssociation"
        },
        {
          "name": "participants",
          "type": "Participant",
          "isMany": true
        },
        {
          "name": "messageFlows",
          "type": "MessageFlow",
          "isMany": true
        },
        {
          "name": "correlationKeys",
          "type": "CorrelationKey",
          "isMany": true
        },
        {
          "name": "conversations",
          "type": "ConversationNode",
          "isMany": true
        },
        {
          "name": "conversationLinks",
          "type": "ConversationLink",
          "isMany": true
        }
      ]
    },
    {
      "name": "ChoreographyActivity",
      "isAbstract": true,
      "superClass": [
        "FlowNode"
      ],
      "properties": [
        {
          "name": "participantRefs",
          "type": "Participant",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "initiatingParticipantRef",
          "type": "Participant",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "correlationKeys",
          "type": "CorrelationKey",
          "isMany": true
        },
        {
          "name": "loopType",
          "type": "ChoreographyLoopType",
          "default": "None",
          "isAttr": true
        }
      ]
    },
    {
      "name": "CallChoreography",
      "superClass": [
        "ChoreographyActivity"
      ],
      "properties": [
        {
          "name": "calledChoreographyRef",
          "type": "Choreography",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "participantAssociations",
          "type": "ParticipantAssociation",
          "isMany": true
        }
      ]
    },
    {
      "name": "SubChoreography",
      "superClass": [
        "ChoreographyActivity",
        "FlowElementsContainer"
      ],
      "properties": [
        {
          "name": "artifacts",
          "type": "Artifact",
          "isMany": true
        }
      ]
    },
    {
      "name": "ChoreographyTask",
      "superClass": [
        "ChoreographyActivity"
      ],
      "properties": [
        {
          "name": "messageFlowRef",
          "type": "MessageFlow",
          "isMany": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Choreography",
      "superClass": [
        "FlowElementsContainer",
        "Collaboration"
      ]
    },
    {
      "name": "GlobalChoreographyTask",
      "superClass": [
        "Choreography"
      ],
      "properties": [
        {
          "name": "initiatingParticipantRef",
          "type": "Participant",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "TextAnnotation",
      "superClass": [
        "Artifact"
      ],
      "properties": [
        {
          "name": "text",
          "type": "String"
        },
        {
          "name": "textFormat",
          "default": "text/plain",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Group",
      "superClass": [
        "Artifact"
      ],
      "properties": [
        {
          "name": "categoryValueRef",
          "type": "CategoryValue",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Association",
      "superClass": [
        "Artifact"
      ],
      "properties": [
        {
          "name": "associationDirection",
          "type": "AssociationDirection",
          "isAttr": true
        },
        {
          "name": "sourceRef",
          "type": "BaseElement",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "targetRef",
          "type": "BaseElement",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "Category",
      "superClass": [
        "RootElement"
      ],
      "properties": [
        {
          "name": "categoryValue",
          "type": "CategoryValue",
          "isMany": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Artifact",
      "isAbstract": true,
      "superClass": [
        "BaseElement"
      ]
    },
    {
      "name": "CategoryValue",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "categorizedFlowElements",
          "type": "FlowElement",
          "isVirtual": true,
          "isMany": true,
          "isReference": true
        },
        {
          "name": "value",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Activity",
      "isAbstract": true,
      "superClass": [
        "FlowNode"
      ],
      "properties": [
        {
          "name": "isForCompensation",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "loopCharacteristics",
          "type": "LoopCharacteristics"
        },
        {
          "name": "resources",
          "type": "ResourceRole",
          "isMany": true
        },
        {
          "name": "default",
          "type": "SequenceFlow",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "properties",
          "type": "Property",
          "isMany": true
        },
        {
          "name": "ioSpecification",
          "type": "InputOutputSpecification"
        },
        {
          "name": "boundaryEventRefs",
          "type": "BoundaryEvent",
          "isMany": true,
          "isReference": true
        },
        {
          "name": "dataInputAssociations",
          "type": "DataInputAssociation",
          "isMany": true
        },
        {
          "name": "dataOutputAssociations",
          "type": "DataOutputAssociation",
          "isMany": true
        },
        {
          "name": "startQuantity",
          "default": 1,
          "isAttr": true,
          "type": "Integer"
        },
        {
          "name": "completionQuantity",
          "default": 1,
          "isAttr": true,
          "type": "Integer"
        }
      ]
    },
    {
      "name": "ServiceTask",
      "superClass": [
        "Task"
      ],
      "properties": [
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "operationRef",
          "type": "Operation",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "SubProcess",
      "superClass": [
        "Activity",
        "FlowElementsContainer"
      ],
      "properties": [
        {
          "name": "triggeredByEvent",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "artifacts",
          "type": "Artifact",
          "isMany": true
        }
      ]
    },
    {
      "name": "LoopCharacteristics",
      "isAbstract": true,
      "superClass": [
        "BaseElement"
      ]
    },
    {
      "name": "MultiInstanceLoopCharacteristics",
      "superClass": [
        "LoopCharacteristics"
      ],
      "properties": [
        {
          "name": "isSequential",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "behavior",
          "type": "MultiInstanceBehavior",
          "default": "All",
          "isAttr": true
        },
        {
          "name": "loopCardinality",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "loopDataInputRef",
          "type": "ItemAwareElement",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "loopDataOutputRef",
          "type": "ItemAwareElement",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "inputDataItem",
          "type": "DataInput"
        },
        {
          "name": "outputDataItem",
          "type": "DataOutput"
        },
        {
          "name": "completionCondition",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "complexBehaviorDefinition",
          "type": "ComplexBehaviorDefinition",
          "isMany": true
        },
        {
          "name": "oneBehaviorEventRef",
          "type": "EventDefinition",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "noneBehaviorEventRef",
          "type": "EventDefinition",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "StandardLoopCharacteristics",
      "superClass": [
        "LoopCharacteristics"
      ],
      "properties": [
        {
          "name": "testBefore",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "loopCondition",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "loopMaximum",
          "type": "Expression",
          "serialize": "xsi:type"
        }
      ]
    },
    {
      "name": "CallActivity",
      "superClass": [
        "Activity"
      ],
      "properties": [
        {
          "name": "calledElement",
          "type": "String",
          "isAttr": true
        }
      ]
    },
    {
      "name": "Task",
      "superClass": [
        "Activity",
        "InteractionNode"
      ]
    },
    {
      "name": "SendTask",
      "superClass": [
        "Task"
      ],
      "properties": [
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "operationRef",
          "type": "Operation",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "messageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ReceiveTask",
      "superClass": [
        "Task"
      ],
      "properties": [
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "instantiate",
          "default": false,
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "operationRef",
          "type": "Operation",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "messageRef",
          "type": "Message",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ScriptTask",
      "superClass": [
        "Task"
      ],
      "properties": [
        {
          "name": "scriptFormat",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "script",
          "type": "String"
        }
      ]
    },
    {
      "name": "BusinessRuleTask",
      "superClass": [
        "Task"
      ],
      "properties": [
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "AdHocSubProcess",
      "superClass": [
        "SubProcess"
      ],
      "properties": [
        {
          "name": "completionCondition",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "ordering",
          "type": "AdHocOrdering",
          "isAttr": true
        },
        {
          "name": "cancelRemainingInstances",
          "default": true,
          "isAttr": true,
          "type": "Boolean"
        }
      ]
    },
    {
      "name": "Transaction",
      "superClass": [
        "SubProcess"
      ],
      "properties": [
        {
          "name": "protocol",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "method",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "GlobalScriptTask",
      "superClass": [
        "GlobalTask"
      ],
      "properties": [
        {
          "name": "scriptLanguage",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "script",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "GlobalBusinessRuleTask",
      "superClass": [
        "GlobalTask"
      ],
      "properties": [
        {
          "name": "implementation",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "ComplexBehaviorDefinition",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "condition",
          "type": "FormalExpression"
        },
        {
          "name": "event",
          "type": "ImplicitThrowEvent"
        }
      ]
    },
    {
      "name": "ResourceRole",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "resourceRef",
          "type": "Resource",
          "isAttr": true,
          "isReference": true
        },
        {
          "name": "resourceParameterBindings",
          "type": "ResourceParameterBinding",
          "isMany": true
        },
        {
          "name": "resourceAssignmentExpression",
          "type": "ResourceAssignmentExpression"
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "ResourceParameterBinding",
      "properties": [
        {
          "name": "expression",
          "type": "Expression",
          "serialize": "xsi:type"
        },
        {
          "name": "parameterRef",
          "type": "ResourceParameter",
          "isAttr": true,
          "isReference": true
        }
      ]
    },
    {
      "name": "ResourceAssignmentExpression",
      "properties": [
        {
          "name": "expression",
          "type": "Expression",
          "serialize": "xsi:type"
        }
      ]
    },
    {
      "name": "Import",
      "properties": [
        {
          "name": "importType",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "location",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "namespace",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Definitions",
      "superClass": [
        "BaseElement"
      ],
      "properties": [
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "targetNamespace",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "expressionLanguage",
          "default": "http://www.w3.org/1999/XPath",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "typeLanguage",
          "default": "http://www.w3.org/2001/XMLSchema",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "imports",
          "type": "Import",
          "isMany": true
        },
        {
          "name": "extensions",
          "type": "Extension",
          "isMany": true
        },
        {
          "name": "relationships",
          "type": "Relationship",
          "isMany": true
        },
        {
          "name": "rootElements",
          "type": "RootElement",
          "isMany": true
        },
        {
          "name": "diagrams",
          "isMany": true,
          "type": "bpmndi:BPMNDiagram"
        },
        {
          "name": "exporter",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "exporterVersion",
          "isAttr": true,
          "type": "String"
        }
      ]
    }
  ],
  "emumerations": [
    {
      "name": "ProcessType",
      "literalValues": [
        {
          "name": "None"
        },
        {
          "name": "Public"
        },
        {
          "name": "Private"
        }
      ]
    },
    {
      "name": "GatewayDirection",
      "literalValues": [
        {
          "name": "Unspecified"
        },
        {
          "name": "Converging"
        },
        {
          "name": "Diverging"
        },
        {
          "name": "Mixed"
        }
      ]
    },
    {
      "name": "EventBasedGatewayType",
      "literalValues": [
        {
          "name": "Parallel"
        },
        {
          "name": "Exclusive"
        }
      ]
    },
    {
      "name": "RelationshipDirection",
      "literalValues": [
        {
          "name": "None"
        },
        {
          "name": "Forward"
        },
        {
          "name": "Backward"
        },
        {
          "name": "Both"
        }
      ]
    },
    {
      "name": "ItemKind",
      "literalValues": [
        {
          "name": "Physical"
        },
        {
          "name": "Information"
        }
      ]
    },
    {
      "name": "ChoreographyLoopType",
      "literalValues": [
        {
          "name": "None"
        },
        {
          "name": "Standard"
        },
        {
          "name": "MultiInstanceSequential"
        },
        {
          "name": "MultiInstanceParallel"
        }
      ]
    },
    {
      "name": "AssociationDirection",
      "literalValues": [
        {
          "name": "None"
        },
        {
          "name": "One"
        },
        {
          "name": "Both"
        }
      ]
    },
    {
      "name": "MultiInstanceBehavior",
      "literalValues": [
        {
          "name": "None"
        },
        {
          "name": "One"
        },
        {
          "name": "All"
        },
        {
          "name": "Complex"
        }
      ]
    },
    {
      "name": "AdHocOrdering",
      "literalValues": [
        {
          "name": "Parallel"
        },
        {
          "name": "Sequential"
        }
      ]
    }
  ],
  "prefix": "bpmn",
  "xml": {
    "tagAlias": "lowerCase",
    "typePrefix": "t"
  }
}
},{}],54:[function(_dereq_,module,exports){
module.exports={
  "name": "BPMNDI",
  "uri": "http://www.omg.org/spec/BPMN/20100524/DI",
  "types": [
    {
      "name": "BPMNDiagram",
      "properties": [
        {
          "name": "plane",
          "type": "BPMNPlane",
          "redefines": "di:Diagram#rootElement"
        },
        {
          "name": "labelStyle",
          "type": "BPMNLabelStyle",
          "isMany": true
        }
      ],
      "superClass": [
        "di:Diagram"
      ]
    },
    {
      "name": "BPMNPlane",
      "properties": [
        {
          "name": "bpmnElement",
          "isAttr": true,
          "isReference": true,
          "type": "bpmn:BaseElement",
          "redefines": "di:DiagramElement#modelElement"
        }
      ],
      "superClass": [
        "di:Plane"
      ]
    },
    {
      "name": "BPMNShape",
      "properties": [
        {
          "name": "bpmnElement",
          "isAttr": true,
          "isReference": true,
          "type": "bpmn:BaseElement",
          "redefines": "di:DiagramElement#modelElement"
        },
        {
          "name": "isHorizontal",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "isExpanded",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "isMarkerVisible",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "label",
          "type": "BPMNLabel"
        },
        {
          "name": "isMessageVisible",
          "isAttr": true,
          "type": "Boolean"
        },
        {
          "name": "participantBandKind",
          "type": "ParticipantBandKind",
          "isAttr": true
        },
        {
          "name": "choreographyActivityShape",
          "type": "BPMNShape",
          "isAttr": true,
          "isReference": true
        }
      ],
      "superClass": [
        "di:LabeledShape"
      ]
    },
    {
      "name": "BPMNEdge",
      "properties": [
        {
          "name": "label",
          "type": "BPMNLabel"
        },
        {
          "name": "bpmnElement",
          "isAttr": true,
          "isReference": true,
          "type": "bpmn:BaseElement",
          "redefines": "di:DiagramElement#modelElement"
        },
        {
          "name": "sourceElement",
          "isAttr": true,
          "isReference": true,
          "type": "di:DiagramElement",
          "redefines": "di:Edge#source"
        },
        {
          "name": "targetElement",
          "isAttr": true,
          "isReference": true,
          "type": "di:DiagramElement",
          "redefines": "di:Edge#target"
        },
        {
          "name": "messageVisibleKind",
          "type": "MessageVisibleKind",
          "isAttr": true,
          "default": "initiating"
        }
      ],
      "superClass": [
        "di:LabeledEdge"
      ]
    },
    {
      "name": "BPMNLabel",
      "properties": [
        {
          "name": "labelStyle",
          "type": "BPMNLabelStyle",
          "isAttr": true,
          "isReference": true,
          "redefines": "di:DiagramElement#style"
        }
      ],
      "superClass": [
        "di:Label"
      ]
    },
    {
      "name": "BPMNLabelStyle",
      "properties": [
        {
          "name": "font",
          "type": "dc:Font"
        }
      ],
      "superClass": [
        "di:Style"
      ]
    }
  ],
  "emumerations": [
    {
      "name": "ParticipantBandKind",
      "literalValues": [
        {
          "name": "top_initiating"
        },
        {
          "name": "middle_initiating"
        },
        {
          "name": "bottom_initiating"
        },
        {
          "name": "top_non_initiating"
        },
        {
          "name": "middle_non_initiating"
        },
        {
          "name": "bottom_non_initiating"
        }
      ]
    },
    {
      "name": "MessageVisibleKind",
      "literalValues": [
        {
          "name": "initiating"
        },
        {
          "name": "non_initiating"
        }
      ]
    }
  ],
  "associations": [],
  "prefix": "bpmndi"
}
},{}],55:[function(_dereq_,module,exports){
module.exports={
  "name": "DC",
  "uri": "http://www.omg.org/spec/DD/20100524/DC",
  "types": [
    {
      "name": "Boolean"
    },
    {
      "name": "Integer"
    },
    {
      "name": "Real"
    },
    {
      "name": "String"
    },
    {
      "name": "Font",
      "properties": [
        {
          "name": "name",
          "type": "String",
          "isAttr": true
        },
        {
          "name": "size",
          "type": "Real",
          "isAttr": true
        },
        {
          "name": "isBold",
          "type": "Boolean",
          "isAttr": true
        },
        {
          "name": "isItalic",
          "type": "Boolean",
          "isAttr": true
        },
        {
          "name": "isUnderline",
          "type": "Boolean",
          "isAttr": true
        },
        {
          "name": "isStrikeThrough",
          "type": "Boolean",
          "isAttr": true
        }
      ]
    },
    {
      "name": "Point",
      "properties": [
        {
          "name": "x",
          "type": "Real",
          "default": "0",
          "isAttr": true
        },
        {
          "name": "y",
          "type": "Real",
          "default": "0",
          "isAttr": true
        }
      ]
    },
    {
      "name": "Bounds",
      "properties": [
        {
          "name": "x",
          "type": "Real",
          "default": "0",
          "isAttr": true
        },
        {
          "name": "y",
          "type": "Real",
          "default": "0",
          "isAttr": true
        },
        {
          "name": "width",
          "type": "Real",
          "isAttr": true
        },
        {
          "name": "height",
          "type": "Real",
          "isAttr": true
        }
      ]
    }
  ],
  "prefix": "dc",
  "associations": []
}
},{}],56:[function(_dereq_,module,exports){
module.exports={
  "name": "DI",
  "uri": "http://www.omg.org/spec/DD/20100524/DI",
  "types": [
    {
      "name": "DiagramElement",
      "isAbstract": true,
      "properties": [
        {
          "name": "extension",
          "type": "Extension"
        },
        {
          "name": "owningDiagram",
          "type": "Diagram",
          "isReadOnly": true,
          "isVirtual": true,
          "isReference": true
        },
        {
          "name": "owningElement",
          "type": "DiagramElement",
          "isReadOnly": true,
          "isVirtual": true,
          "isReference": true
        },
        {
          "name": "modelElement",
          "isReadOnly": true,
          "isVirtual": true,
          "isReference": true,
          "type": "Element"
        },
        {
          "name": "style",
          "type": "Style",
          "isReadOnly": true,
          "isVirtual": true,
          "isReference": true
        },
        {
          "name": "ownedElement",
          "type": "DiagramElement",
          "isReadOnly": true,
          "isVirtual": true,
          "isMany": true
        }
      ]
    },
    {
      "name": "Node",
      "isAbstract": true,
      "superClass": [
        "DiagramElement"
      ]
    },
    {
      "name": "Edge",
      "isAbstract": true,
      "superClass": [
        "DiagramElement"
      ],
      "properties": [
        {
          "name": "source",
          "type": "DiagramElement",
          "isReadOnly": true,
          "isVirtual": true,
          "isReference": true
        },
        {
          "name": "target",
          "type": "DiagramElement",
          "isReadOnly": true,
          "isVirtual": true,
          "isReference": true
        },
        {
          "name": "waypoint",
          "isUnique": false,
          "isMany": true,
          "type": "dc:Point",
          "serialize": "xsi:type"
        }
      ]
    },
    {
      "name": "Diagram",
      "isAbstract": true,
      "properties": [
        {
          "name": "rootElement",
          "type": "DiagramElement",
          "isReadOnly": true,
          "isVirtual": true
        },
        {
          "name": "name",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "documentation",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "resolution",
          "isAttr": true,
          "type": "Real"
        },
        {
          "name": "ownedStyle",
          "type": "Style",
          "isReadOnly": true,
          "isVirtual": true,
          "isMany": true
        }
      ]
    },
    {
      "name": "Shape",
      "isAbstract": true,
      "superClass": [
        "Node"
      ],
      "properties": [
        {
          "name": "bounds",
          "type": "dc:Bounds"
        }
      ]
    },
    {
      "name": "Plane",
      "isAbstract": true,
      "superClass": [
        "Node"
      ],
      "properties": [
        {
          "name": "planeElement",
          "type": "DiagramElement",
          "subsettedProperty": "DiagramElement-ownedElement",
          "isMany": true
        }
      ]
    },
    {
      "name": "LabeledEdge",
      "isAbstract": true,
      "superClass": [
        "Edge"
      ],
      "properties": [
        {
          "name": "ownedLabel",
          "type": "Label",
          "isReadOnly": true,
          "subsettedProperty": "DiagramElement-ownedElement",
          "isVirtual": true,
          "isMany": true
        }
      ]
    },
    {
      "name": "LabeledShape",
      "isAbstract": true,
      "superClass": [
        "Shape"
      ],
      "properties": [
        {
          "name": "ownedLabel",
          "type": "Label",
          "isReadOnly": true,
          "subsettedProperty": "DiagramElement-ownedElement",
          "isVirtual": true,
          "isMany": true
        }
      ]
    },
    {
      "name": "Label",
      "isAbstract": true,
      "superClass": [
        "Node"
      ],
      "properties": [
        {
          "name": "bounds",
          "type": "dc:Bounds"
        }
      ]
    },
    {
      "name": "Style",
      "isAbstract": true
    },
    {
      "name": "Extension",
      "properties": [
        {
          "name": "values",
          "type": "Element",
          "isMany": true
        }
      ]
    }
  ],
  "associations": [],
  "prefix": "di",
  "xml": {
    "tagAlias": "lowerCase"
  }
}
},{}],57:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __depends__: [ _dereq_(91) ],
  __init__: [ 'directEditing' ],
  directEditing: [ 'type', _dereq_(58) ]
};
},{}],58:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var TextBox = _dereq_(59);


/**
 * A direct editing component that allows users
 * to edit an elements text directly in the diagram
 *
 * @param {EventBus} eventBus the event bus
 */
function DirectEditing(eventBus, canvas) {

  this._eventBus = eventBus;

  this._providers = [];
  this._textbox = new TextBox({
    container: canvas.getContainer(),
    keyHandler: _.bind(this._handleKey, this)
  });
}

DirectEditing.$inject = [ 'eventBus', 'canvas' ];


/**
 * Register a direct editing provider

 * @param {Object} provider the provider, must expose an #activate(element) method that returns
 *                          an activation context ({ bounds: {x, y, width, height }, text }) if
 *                          direct editing is available for the given element.
 *                          Additionally the provider must expose a #update(element, value) method
 *                          to receive direct editing updates.
 */
DirectEditing.prototype.registerProvider = function(provider) {
  this._providers.push(provider);
};


/**
 * Returns true if direct editing is currently active
 *
 * @return {Boolean}
 */
DirectEditing.prototype.isActive = function() {
  return !!this._active;
};


/**
 * Cancel direct editing, if it is currently active
 */
DirectEditing.prototype.cancel = function() {
  if (!this._active) {
    return;
  }

  this._fire('cancel');
  this.close();
};


DirectEditing.prototype._fire = function(event) {
  this._eventBus.fire('directEditing.' + event, { active: this._active });
};

DirectEditing.prototype.close = function() {
  this._textbox.destroy();

  this._fire('deactivate');

  this._active = null;
};


DirectEditing.prototype.complete = function() {

  var active = this._active;

  if (!active) {
    return;
  }

  var text = this.getValue();

  if (text !== active.context.text) {
    active.provider.update(active.element, text, active.context.text);
  }

  this._fire('complete');

  this.close();
};


DirectEditing.prototype.getValue = function() {
  return this._textbox.getValue();
};


DirectEditing.prototype._handleKey = function(e) {

  // stop bubble
  e.stopPropagation();

  var key = e.which;

  // ESC
  if (key === 27) {
    e.preventDefault();
    return this.cancel();
  }

  // Enter
  if (key === 13 && !e.shiftKey) {
    e.preventDefault();
    return this.complete();
  }
};


/**
 * Activate direct editing on the given element
 *
 * @param {Object} ElementDescriptor the descriptor for a shape or connection
 * @return {Boolean} true if the activation was possible
 */
DirectEditing.prototype.activate = function(element) {

  if (this.isActive()) {
    this.cancel();
  }

  // the direct editing context
  var context;

  var provider = _.find(this._providers, function(p) {
    return !!(context = p.activate(element)) ? p : null;
  });

  // check if activation took place
  if (context) {
    this._textbox.create(context.bounds, context.style, context.text);

    this._active = {
      element: element,
      context: context,
      provider: provider
    };

    this._fire('activate');
  }

  return !!context;
};


module.exports = DirectEditing;
},{}],59:[function(_dereq_,module,exports){
'use strict';

var $ = (window.$);


function TextBox(options) {

  this.container = options.container;
  this.textarea = $('<textarea />');

  this.keyHandler = options.keyHandler || function() {};
}

module.exports = TextBox;


TextBox.prototype.create = function(bounds, style, value) {
  var css = $.extend({
    width: bounds.width,
    height: bounds.height,
    left: bounds.x,
    top: bounds.y,
    position: 'absolute',
    textAlign: 'center',
    boxSizing: 'border-box'
  }, style || {});

  this.textarea
    .val(value || '')
    .appendTo(this.container)
    .css(css)
    .attr('title', 'Press SHIFT+Enter for line feed')
    .focus()
    .select()
    .on('keydown', this.keyHandler);
};

TextBox.prototype.destroy = function() {
  this.textarea
    .val('')
    .remove()
    .off('keydown', this.keyHandler);
};

TextBox.prototype.getValue = function() {
  return this.textarea.val();
};
},{}],60:[function(_dereq_,module,exports){
module.exports = _dereq_(61);
},{}],61:[function(_dereq_,module,exports){
'use strict';

var di = _dereq_(158);

/**
 * @namespace djs
 */

/**
 * Bootstrap an injector from a list of modules, instantiating a number of default components
 *
 * @ignore
 * @param {Array<didi.Module>} bootstrapModules
 *
 * @return {didi.Injector} a injector to use to access the components
 */
function bootstrap(bootstrapModules) {

  var modules = [],
      components = [];

  function hasModule(m) {
    return modules.indexOf(m) >= 0;
  }

  function addModule(m) {
    modules.push(m);
  }

  function visit(m) {
    if (hasModule(m)) {
      return;
    }

    (m.__depends__ || []).forEach(visit);

    if (hasModule(m)) {
      return;
    }

    addModule(m);

    (m.__init__ || []).forEach(function(c) {
      components.push(c);
    });
  }

  bootstrapModules.forEach(visit);

  var injector = new di.Injector(modules);

  components.forEach(function(c) {

    try {
      // eagerly resolve component (fn or string)
      injector[typeof c === 'string' ? 'get' : 'invoke'](c);
    } catch (e) {
      console.error('Failed to instantiate component');
      console.error(e.stack);

      throw e;
    }
  });

  return injector;
}

/**
 * Creates an injector from passed options.
 *
 * @ignore
 * @param  {Object} options
 * @return {didi.Injector}
 */
function createInjector(options) {

  options = options || {};

  var configModule = {
    'config': ['value', options]
  };

  var coreModule = _dereq_(69);

  var modules = [ configModule, coreModule ].concat(options.modules || []);

  return bootstrap(modules);
}


/**
 * The main diagram-js entry point that bootstraps the diagram with the given
 * configuration.
 *
 * To register extensions with the diagram, pass them as Array<didi.Module> to the constructor.
 *
 * @class djs.Diagram
 * @memberOf djs
 * @constructor
 *
 * @example
 *
 * <caption>Creating a plug-in that logs whenever a shape is added to the canvas.</caption>
 *
 * // plug-in implemenentation
 * function MyLoggingPlugin(eventBus) {
 *   eventBus.on('shape.added', function(event) {
 *     console.log('shape ', event.shape, ' was added to the diagram');
 *   });
 * }
 *
 * // export as module
 * module.exports = {
 *   __init__: [ 'myLoggingPlugin' ],
 *     myLoggingPlugin: [ 'type', MyLoggingPlugin ]
 * };
 *
 *
 * // instantiate the diagram with the new plug-in
 *
 * var diagram = new Diagram({ modules: [ require('path-to-my-logging-plugin') ] });
 *
 * diagram.invoke([ 'canvas', function(canvas) {
 *   // add shape to drawing canvas
 *   canvas.addShape({ x: 10, y: 10 });
 * });
 *
 * // 'shape ... was added to the diagram' logged to console
 *
 * @param {Object} options
 * @param {Array<didi.Module>} [options.modules] external modules to instantiate with the diagram
 * @param {didi.Injector} [injector] an (optional) injector to bootstrap the diagram with
 */
function Diagram(options, injector) {

  // create injector unless explicitly specified
  this.injector = injector = injector || createInjector(options);

  // API

  /**
   * Resolves a diagram service
   *
   * @method Diagram#get
   *
   * @param {String} name the name of the diagram service to be retrieved
   * @param {Object} [locals] a number of locals to use to resolve certain dependencies
   */
  this.get = injector.get;

  /**
   * Executes a function into which diagram services are injected
   *
   * @method Diagram#invoke
   *
   * @param {Function|Object[]} fn the function to resolve
   * @param {Object} locals a number of locals to use to resolve certain dependencies
   */
  this.invoke = injector.invoke;

  // init

  // indicate via event


  /**
   * An event indicating that all plug-ins are loaded.
   *
   * Use this event to fire other events to interested plug-ins
   *
   * @memberOf Diagram
   *
   * @event diagram.init
   *
   * @example
   *
   * eventBus.on('diagram.init', function() {
   *   eventBus.fire('my-custom-event', { foo: 'BAR' });
   * });
   *
   * @type {Object}
   */
  this.get('eventBus').fire('diagram.init');
}

module.exports = Diagram;


/**
 * Destroys the diagram
 *
 * @method  Diagram#destroy
 */
Diagram.prototype.destroy = function() {
  this.get('eventBus').fire('diagram.destroy');
};
},{}],62:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * @namespace djs.command
 */

/**
 * A service that offers re- and undoable execution of commands.
 *
 * @param {EventBus} eventBus
 * @param {Injector} injector
 */
function CommandStack(eventBus, injector) {

  /**
   * A map of all registered command handlers.
   *
   * @type {Object}
   */
  this._handlerMap = {};

  /**
   * A stack containing all re/undoable actions on the diagram
   *
   * @type {Array<Object>}
   */
  this._stack = [];

  /**
   * The current index on the stack
   *
   * @type {Number}
   */
  this._stackIdx = -1;

  /**
   * Current active commandStack execution
   *
   * @type {Object}
   */
  this._currentExecution = {
    actions: [],
    dirty: []
  };


  this._injector = injector;
  this._eventBus = eventBus;

  this._uid = 1;
}

CommandStack.$inject = [ 'eventBus', 'injector' ];

module.exports = CommandStack;


/**
 * Execute a command
 *
 * @param {String} command the command to execute
 * @param {Object} context the environment to execute the command in
 */
CommandStack.prototype.execute = function(command, context) {
  if (!command) {
    throw new Error('command required');
  }

  var action = { command: command, context: context };

  this._pushAction(action);
  this._internalExecute(action);
  this._popAction(action);
};


/**
 * Ask whether a given command can be executed.
 *
 * Implementors may hook into the mechanism on two ways:
 *
 *   * in event listeners:
 *
 *     Users may prevent the execution via an event listener.
 *     It must prevent the default action for `commandStack.(<command>.)canExecute` events.
 *
 *   * in command handlers:
 *
 *     If the method {@link CommandHandler#canExecute} is implemented in a handler
 *     it will be called to figure out whether the execution is allowed.
 *
 * @param  {String} command the command to execute
 * @param  {Object} context the environment to execute the command in
 *
 * @return {Boolean} true if the command can be executed
 */
CommandStack.prototype.canExecute = function(command, context) {

  var action = { command: command, context: context };

  var handler = this._getHandler(command);

  if (!handler) {
    return false;
  }

  var result = this._fire(command, 'canExecute', action);

  if (!result) {
    // may be null or false
    return result;
  }

  if (handler.canExecute) {
    return handler.canExecute(context);
  }

  return true;
};


/**
 * Clear the command stack, erasing all undo / redo history
 */
CommandStack.prototype.clear = function() {
  this._stack.length = 0;
  this._stackIdx = -1;

  this._fire('changed');
};


/**
 * Undo last command(s)
 */
CommandStack.prototype.undo = function() {
  var action = this._getUndoAction(),
      next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalUndo(action);
      next = this._getUndoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};


/**
 * Redo last command(s)
 */
CommandStack.prototype.redo = function() {
  var action = this._getRedoAction(),
      next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalExecute(action, true);
      next = this._getRedoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};


/**
 * Register a handler instance with the command stack
 *
 * @param {String} command
 * @param {CommandHandler} handler
 */
CommandStack.prototype.register = function(command, handler) {
  this._setHandler(command, handler);
};


/**
 * Register a handler type with the command stack
 * by instantiating it and injecting its dependencies.
 *
 * @param {String} command
 * @param {Function} a constructor for a {@link CommandHandler}
 */
CommandStack.prototype.registerHandler = function(command, handlerCls) {

  if (!command || !handlerCls) {
    throw new Error('command and handlerCls must be defined');
  }

  var handler = this._injector.instantiate(handlerCls);
  this.register(command, handler);
};

CommandStack.prototype.canUndo = function() {
  return !!this._getUndoAction();
};

CommandStack.prototype.canRedo = function() {
  return !!this._getRedoAction();
};

////// stack access  //////////////////////////////////////

CommandStack.prototype._getRedoAction = function() {
  return this._stack[this._stackIdx + 1];
};


CommandStack.prototype._getUndoAction = function() {
  return this._stack[this._stackIdx];
};


////// internal functionality /////////////////////////////

CommandStack.prototype._internalUndo = function(action) {
  var command = action.command,
      context = action.context;

  var handler = this._getHandler(command);

  this._fire(command, 'revert', action);

  this._markDirty(handler.revert(context));

  this._revertedAction(action);

  this._fire(command, 'reverted', action);
};


CommandStack.prototype._fire = function(command, qualifier, event) {
  if (arguments.length < 3) {
    event = qualifier;
    qualifier = null;
  }

  var names = qualifier ? [ command + '.' + qualifier, qualifier ] : [ command ],
      i, name, result = true;

  event = event && _.clone(event);

  for (i = 0; !!(name = names[i]); i++) {
    result = this._eventBus.fire('commandStack.' + name, event);

    if (!result) {
      break;
    }
  }

  return result;
};

CommandStack.prototype._createId = function() {
  return this._uid++;
};


CommandStack.prototype._internalExecute = function(action, redo) {
  var command = action.command,
      context = action.context;

  var handler = this._getHandler(command);

  if (!handler) {
    throw new Error('no command handler registered for <' + command + '>');
  }

  this._pushAction(action);

  if (!redo) {
    this._fire(command, 'preExecute', action);

    if (handler.preExecute) {
      handler.preExecute(context);
    }
  }

  this._fire(command, 'execute', action);

  // execute
  this._markDirty(handler.execute(context));

  // log to stack
  this._executedAction(action, redo);

  this._fire(command, 'executed', action);

  if (!redo) {
    if (handler.postExecute) {
      handler.postExecute(context);
    }

    this._fire(command, 'postExecute', action);
  }

  this._popAction(action);
};


CommandStack.prototype._pushAction = function(action) {

  var execution = this._currentExecution,
      actions = execution.actions;

  var baseAction = actions[0];

  if (!action.id) {
    action.id = (baseAction && baseAction.id) || this._createId();
  }

  actions.push(action);
};


CommandStack.prototype._popAction = function() {
  var execution = this._currentExecution,
      actions = execution.actions,
      dirty = execution.dirty;

  actions.pop();

  if (!actions.length) {
    this._eventBus.fire('elements.changed', { elements: _.unique(dirty) });

    dirty.length = 0;

    this._fire('changed');
  }
};


CommandStack.prototype._markDirty = function(elements) {
  var execution = this._currentExecution;

  if (!elements) {
    return;
  }

  elements = _.isArray(elements) ? elements : [ elements ];

  execution.dirty = execution.dirty.concat(elements);
};


CommandStack.prototype._executedAction = function(action, redo) {
  var stackIdx = ++this._stackIdx;

  if (!redo) {
    this._stack.splice(stackIdx, this._stack.length, action);
  }
};


CommandStack.prototype._revertedAction = function(action) {
  this._stackIdx--;
};


CommandStack.prototype._getHandler = function(command) {
  return this._handlerMap[command];
};

CommandStack.prototype._setHandler = function(command, handler) {
  if (!command || !handler) {
    throw new Error('command and handler required');
  }

  if (this._handlerMap[command]) {
    throw new Error('overriding handler for command <' + command + '>');
  }

  this._handlerMap[command] = handler;
};

},{}],63:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(69) ],
  commandStack: [ 'type', _dereq_(62) ]
};
},{}],64:[function(_dereq_,module,exports){
'use strict';


var _ = (window._);

var Collections = _dereq_(148);


function round(number, resolution) {
  return Math.round(number * resolution) / resolution;
}

function ensurePx(number) {
  return _.isNumber(number) ? number + 'px' : number;
}

/**
 * Creates a HTML container element for a SVG element with
 * the given configuration
 *
 * @param  {Object} options
 * @return {HTMLElement} the container element
 */
function createContainer(options) {

  options = _.extend({}, { width: '100%', height: '100%' }, options);

  var container = options.container || document.body;

  // create a <div> around the svg element with the respective size
  // this way we can always get the correct container size
  // (this is impossible for <svg> elements at the moment)
  var parent = document.createElement('div');
  parent.setAttribute('class', 'djs-container');

  _.extend(parent.style, {
    position: 'relative',
    width: ensurePx(options.width),
    height: ensurePx(options.height)
  });

  container.appendChild(parent);

  return parent;
}

function createGroup(parent, cls) {
  return parent.group().attr({ 'class' : cls });
}

var BASE_LAYER = 'base';


/**
 * The main drawing canvas.
 *
 * @class
 * @constructor
 *
 * @emits Canvas#canvas.init
 *
 * @param {Object} config
 * @param {EventBus} eventBus
 * @param {GraphicsFactory} graphicsFactory
 * @param {ElementRegistry} elementRegistry
 * @param {Snap} snap
 */
function Canvas(config, eventBus, graphicsFactory, elementRegistry, snap) {

  this._snap = snap;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;

  this._init(config || {});
}

Canvas.$inject = [ 'config.canvas', 'eventBus', 'graphicsFactory', 'elementRegistry', 'snap' ];

module.exports = Canvas;


Canvas.prototype._init = function(config) {

  // Creates a <svg> element that is wrapped into a <div>.
  // This way we are always able to correctly figure out the size of the svg element
  // by querying the parent node.
  //
  // (It is not possible to get the size of a svg element cross browser @ 2014-04-01)
  //
  // <div class="djs-container" style="width: {desired-width}, height: {desired-height}">
  //   <svg width="100%" height="100%">
  //    ...
  //   </svg>
  // </div>

  // html container
  var eventBus = this._eventBus,
      snap = this._snap,

      container = createContainer(config),
      svg = snap.createSnapAt('100%', '100%', container),
      viewport = createGroup(svg, 'viewport'),

      self = this;

  this._container = container;
  this._svg = svg;
  this._viewport = viewport;
  this._layers = {};

  eventBus.on('diagram.init', function(event) {

    /**
     * An event indicating that the canvas is ready to be drawn on.
     *
     * @memberOf Canvas
     *
     * @event canvas.init
     *
     * @type {Object}
     * @property {Snap<SVGSVGElement>} svg the created svg element
     * @property {Snap<SVGGroup>} viewport the direct parent of diagram elements and shapes
     */
    eventBus.fire('canvas.init', { svg: svg, viewport: viewport });
  });

  eventBus.on('diagram.destroy', function() {

    var parent = self._container.parentNode;

    if (parent) {
      parent.removeChild(container);
    }

    eventBus.fire('canvas.destroy', { svg: self._svg, viewport: self._viewport });

    self._svg.remove();

    self._svg = self._container = self._layers = self._viewport = null;
  });

};

/**
 * Returns the default layer on which
 * all elements are drawn.
 *
 * @returns {Snap<SVGGroup>}
 */
Canvas.prototype.getDefaultLayer = function() {
  return this.getLayer(BASE_LAYER);
};

/**
 * Returns a layer that is used to draw elements
 * or annotations on it.
 *
 * @param  {String} name
 *
 * @returns {Snap<SVGGroup>}
 */
Canvas.prototype.getLayer = function(name) {

  if (!name) {
    throw new Error('must specify a name');
  }

  var layer = this._layers[name];
  if (!layer) {
    layer = this._layers[name] = createGroup(this._viewport, 'layer-' + name);
  }

  return layer;
};


/**
 * Returns the html element that encloses the
 * drawing canvas.
 *
 * @return {DOMNode}
 */
Canvas.prototype.getContainer = function() {
  return this._container;
};


/////////////// markers ///////////////////////////////////

Canvas.prototype._updateMarker = function(element, marker, add) {
  var gfx;

  if (!element.id) {
    element = this._elementRegistry.get(element);
  }

  gfx = this.getGraphics(element);

  if (!gfx) {
    return;
  }

  // invoke either addClass or removeClass based on mode
  gfx[add ? 'addClass' : 'removeClass'](marker);

  /**
   * An event indicating that a marker has been updated for an element
   *
   * @event element.marker.update
   * @type {Object}
   * @property {djs.model.Element} element the shape
   * @property {Object} gfx the graphical representation of the shape
   * @property {String} marker
   * @property {Boolean} add true if the marker was added, false if it got removed
   */
  this._eventBus.fire('element.marker.update', { element: element, gfx: gfx, marker: marker, add: !!add });
};


/**
 * Adds a marker to an element (basically a css class).
 *
 * Fires the element.marker.update event, making it possible to
 * integrate extension into the marker life-cycle, too.
 *
 * @example
 * canvas.addMarker('foo', 'some-marker');
 *
 * var fooGfx = canvas.getGraphics('foo');
 *
 * fooGfx; // <g class="... some-marker"> ... </g>
 *
 * @param {String|djs.model.Base} element
 * @param {String} marker
 */
Canvas.prototype.addMarker = function(element, marker) {
  this._updateMarker(element, marker, true);
};


/**
 * Remove a marker from an element.
 *
 * Fires the element.marker.update event, making it possible to
 * integrate extension into the marker life-cycle, too.
 *
 * @param  {String|djs.model.Base} element
 * @param  {String} marker
 */
Canvas.prototype.removeMarker = function(element, marker) {
  this._updateMarker(element, marker, false);
};

Canvas.prototype.getRootElement = function() {
  if (!this._rootElement) {
    this.setRootElement({ id: '__implicitroot' });
  }

  return this._rootElement;
};



//////////////// root element handling ///////////////////////////

/**
 * Sets a given element as the new root element for the canvas
 * and returns it.
 *
 * @param {Object|djs.model.Root} element
 * @param {Boolean} [override] whether to override the current root element, if any
 */
Canvas.prototype.setRootElement = function(element, override) {

  var rootElement = this._rootElement,
      elementRegistry = this._elementRegistry;

  if (rootElement) {
    if (!override) {
      throw new Error('rootElement already defined');
    }

    elementRegistry.remove(rootElement);
  }

  elementRegistry.add(element, this.getDefaultLayer(), this._svg);

  this._rootElement = element;

  return element;
};



///////////// add functionality ///////////////////////////////

Canvas.prototype._ensureValidId = function(element) {
  if (!element.id) {
    throw new Error('element must have an id');
  }

  if (this._elementRegistry.get(element.id)) {
    throw new Error('element with id ' + element.id + ' already exists');
  }
};

Canvas.prototype._setParent = function(element, parent) {
  Collections.add(parent.children, element);
  element.parent = parent;
};

/**
 * Adds an element to the canvas.
 *
 * This wires the parent <-> child relationship between the element and
 * a explicitly specified parent or an implicit root element.
 *
 * During add it emits the events
 *
 *  * <{type}.add> (element, parent)
 *  * <{type}.added> (element, gfx)
 *
 * Extensions may hook into these events to perform their magic.
 *
 * @param {String} type
 * @param {Object|djs.model.Base} element
 * @param {Object|djs.model.Base} [parent]
 *
 * @return {Object|djs.model.Base} the added element
 */
Canvas.prototype._addElement = function(type, element, parent) {

  parent = parent || this.getRootElement();

  var eventBus = this._eventBus,
      graphicsFactory = this._graphicsFactory;

  this._ensureValidId(element);

  eventBus.fire(type + '.add', { element: element, parent: parent });

  this._setParent(element, parent);

  // create graphics
  var gfx = graphicsFactory.create(type, element);

  this._elementRegistry.add(element, gfx);

  // update its visual
  graphicsFactory.update(type, element, gfx);

  eventBus.fire(type + '.added', { element: element, gfx: gfx });

  return element;
};

/**
 * Adds a shape to the canvas
 *
 * @param {Object|djs.model.Shape} shape to add to the diagram
 * @param {djs.model.Base} [parent]
 *
 * @return {djs.model.Shape} the added shape
 */
Canvas.prototype.addShape = function(shape, parent) {
  return this._addElement('shape', shape, parent);
};

/**
 * Adds a connection to the canvas
 *
 * @param {Object|djs.model.Connection} connection to add to the diagram
 * @param {djs.model.Base} [parent]
 *
 * @return {djs.model.Connection} the added connection
 */
Canvas.prototype.addConnection = function(connection, parent) {
  return this._addElement('connection', connection, parent);
};


/**
 * Internal remove element
 */
Canvas.prototype._removeElement = function(element, type) {

  var elementRegistry = this._elementRegistry,
      graphicsFactory = this._graphicsFactory,
      eventBus = this._eventBus;

  element = elementRegistry.get(element.id || element);

  if (!element) {
    // element was removed already
    return;
  }

  eventBus.fire(type + '.remove', { element: element });

  graphicsFactory.remove(element);

  // unset parent <-> child relationship
  Collections.remove(element.parent && element.parent.children, element);
  element.parent = null;

  eventBus.fire(type + '.removed', { element: element });

  elementRegistry.remove(element);

  return element;
};


/**
 * Removes a shape from the canvas
 *
 * @param {String|djs.model.Shape} shape or shape id to be removed
 *
 * @return {djs.model.Shape} the removed shape
 */
Canvas.prototype.removeShape = function(shape) {

  /**
   * An event indicating that a shape is about to be removed from the canvas.
   *
   * @memberOf Canvas
   *
   * @event shape.remove
   * @type {Object}
   * @property {djs.model.Shape} element the shape descriptor
   * @property {Object} gfx the graphical representation of the shape
   */

  /**
   * An event indicating that a shape has been removed from the canvas.
   *
   * @memberOf Canvas
   *
   * @event shape.removed
   * @type {Object}
   * @property {djs.model.Shape} element the shape descriptor
   * @property {Object} gfx the graphical representation of the shape
   */
  return this._removeElement(shape, 'shape');
};


/**
 * Removes a connection from the canvas
 *
 * @param {String|djs.model.Connection} connection or connection id to be removed
 *
 * @return {djs.model.Connection} the removed connection
 */
Canvas.prototype.removeConnection = function(connection) {

  /**
   * An event indicating that a connection is about to be removed from the canvas.
   *
   * @memberOf Canvas
   *
   * @event connection.remove
   * @type {Object}
   * @property {djs.model.Connection} element the connection descriptor
   * @property {Object} gfx the graphical representation of the connection
   */

  /**
   * An event indicating that a connection has been removed from the canvas.
   *
   * @memberOf Canvas
   *
   * @event connection.removed
   * @type {Object}
   * @property {djs.model.Connection} element the connection descriptor
   * @property {Object} gfx the graphical representation of the connection
   */
  return this._removeElement(connection, 'connection');
};


/**
 * Sends a shape to the front.
 *
 * This method takes parent / child relationships between shapes into account
 * and makes sure that children are properly handled, too.
 *
 * @param {djs.model.Shape} shape descriptor of the shape to be sent to front
 * @param {boolean} [bubble=true] whether to send parent shapes to front, too
 */
Canvas.prototype.sendToFront = function(shape, bubble) {

  if (bubble !== false) {
    bubble = true;
  }

  if (bubble && shape.parent) {
    this.sendToFront(shape.parent);
  }

  _.forEach(shape.children, function(child) {
    this.sendToFront(child, false);
  }, this);

  var gfx = this.getGraphics(shape),
      gfxParent = gfx.parent();

  gfx.remove().appendTo(gfxParent);
};


/**
 * Return the graphical object underlaying a certain diagram element
 *
 * @param {String|djs.model.Base} element descriptor of the element
 */
Canvas.prototype.getGraphics = function(element) {
  return this._elementRegistry.getGraphics(element);
};


Canvas.prototype._fireViewboxChange = function() {
  this._eventBus.fire('canvas.viewbox.changed', { viewbox: this.viewbox(false) });
};


/**
 * Gets or sets the view box of the canvas, i.e. the area that is currently displayed
 *
 * @param  {Object} [box] the new view box to set
 * @param  {Number} box.x the top left X coordinate of the canvas visible in view box
 * @param  {Number} box.y the top left Y coordinate of the canvas visible in view box
 * @param  {Number} box.width the visible width
 * @param  {Number} box.height
 *
 * @example
 *
 * canvas.viewbox({ x: 100, y: 100, width: 500, height: 500 })
 *
 * // sets the visible area of the diagram to (100|100) -> (600|100)
 * // and and scales it according to the diagram width
 *
 * @return {Object} the current view box
 */
Canvas.prototype.viewbox = function(box) {

  if (box === undefined && this._cachedViewbox) {
    return this._cachedViewbox;
  }

  var viewport = this._viewport,
      innerBox,
      outerBox = this.getSize(),
      matrix,
      scale,
      x, y;

  if (!box) {
    innerBox = viewport.getBBox(true);

    matrix = viewport.transform().localMatrix;
    scale = round(matrix.a, 1000);

    x = round(-matrix.e || 0, 1000);
    y = round(-matrix.f || 0, 1000);

    box = this._cachedViewbox = {
      x: x ? x / scale : 0,
      y: y ? y / scale : 0,
      width: outerBox.width / scale,
      height: outerBox.height / scale,
      scale: scale,
      inner: {
        width: innerBox.width,
        height: innerBox.height,
        x: innerBox.x,
        y: innerBox.y
      },
      outer: outerBox
    };

    return box;
  } else {
    scale = Math.max(outerBox.width / box.width, outerBox.height / box.height);

    matrix = new this._snap.Matrix().scale(scale).translate(-box.x, -box.y);
    viewport.transform(matrix);

    this._fireViewboxChange();
  }

  return box;
};


/**
 * Gets or sets the scroll of the canvas.
 *
 * @param {Object} [delta] the new scroll to apply.
 *
 * @param {Number} [delta.dx]
 * @param {Number} [delta.dy]
 */
Canvas.prototype.scroll = function(delta) {

  var node = this._viewport.node;
  var matrix = node.getCTM();

  if (delta) {
    delta = _.extend({ dx: 0, dy: 0 }, delta || {});

    matrix = this._svg.node.createSVGMatrix().translate(delta.dx, delta.dy).multiply(matrix);

    setCTM(node, matrix);

    this._fireViewboxChange();
  }

  return { x: matrix.e, y: matrix.f };
};


/**
 * Gets or sets the current zoom of the canvas, optionally zooming to the specified position.
 *
 * @param {String|Number} [newScale] the new zoom level, either a number, i.e. 0.9,
 *                                   or `fit-viewport` to adjust the size to fit the current viewport
 * @param {String|Point} [center] the reference point { x: .., y: ..} to zoom to, 'auto' to zoom into mid or null
 *
 * @return {Number} the current scale
 */
Canvas.prototype.zoom = function(newScale, center) {

  var vbox = this.viewbox();

  if (newScale === undefined) {
    return vbox.scale;
  }

  var outer = vbox.outer;

  if (newScale === 'fit-viewport') {
    newScale = Math.min(1,
      outer.width / (vbox.inner.width + vbox.inner.x),
      outer.height / (vbox.inner.height + vbox.inner.y));
  }

  if (center === 'auto') {
    center = {
      x: outer.width / 2,
      y: outer.height / 2
    };
  }

  var matrix = this._setZoom(newScale, center);

  this._fireViewboxChange();

  return round(matrix.a, 1000);
};

function setCTM(node, m) {
  var mstr = 'matrix(' + m.a + ',' + m.b + ',' + m.c + ',' + m.d + ',' + m.e + ',' + m.f + ')';
  node.setAttribute('transform', mstr);
}

Canvas.prototype._setZoom = function(scale, center) {

  var svg = this._svg.node,
      viewport = this._viewport.node;

  var matrix = svg.createSVGMatrix();
  var point = svg.createSVGPoint();

  var centerPoint,
      originalPoint,
      currentMatrix,
      scaleMatrix,
      newMatrix;

  currentMatrix = viewport.getCTM();


  var currentScale = currentMatrix.a;

  if (center) {
    centerPoint = _.extend(point, center);

    // revert applied viewport transformations
    originalPoint = centerPoint.matrixTransform(currentMatrix.inverse());

    // create scale matrix
    scaleMatrix = matrix
                    .translate(originalPoint.x, originalPoint.y)
                    .scale(1 / currentScale * scale)
                    .translate(-originalPoint.x, -originalPoint.y);

    newMatrix = currentMatrix.multiply(scaleMatrix);
  } else {
    newMatrix = matrix.scale(scale);
  }

  setCTM(this._viewport.node, newMatrix);

  return newMatrix;
};


/**
 * Returns the size of the canvas
 *
 * @return {Dimensions}
 */
Canvas.prototype.getSize = function () {
  return {
    width: this._container.clientWidth,
    height: this._container.clientHeight
  };
};


/**
 * Return the absolute bounding box for the given element
 *
 * The absolute bounding box may be used to display overlays in the
 * callers (browser) coordinate system rather than the zoomed in/out
 * canvas coordinates.
 *
 * @param  {ElementDescriptor} element
 * @return {Bounds} the absolute bounding box
 */
Canvas.prototype.getAbsoluteBBox = function(element) {
  var vbox = this.viewbox();
  var bbox;

  // connection
  // use svg bbox
  if (element.waypoints) {
    var gfx = this.getGraphics(element);

    var transformBBox = gfx.getBBox(true);
    bbox = gfx.getBBox();

    bbox.x -= transformBBox.x;
    bbox.y -= transformBBox.y;

    bbox.width += 2 * transformBBox.x;
    bbox.height +=  2 * transformBBox.y;
  }
  // shapes
  // use data
  else {
    bbox = element;
  }

  var x = bbox.x * vbox.scale - vbox.x * vbox.scale;
  var y = bbox.y * vbox.scale - vbox.y * vbox.scale;

  var width = bbox.width * vbox.scale;
  var height = bbox.height * vbox.scale;

  return {
    x: x,
    y: y,
    width: width,
    height: height
  };
};
},{}],65:[function(_dereq_,module,exports){
'use strict';

var Model = _dereq_(142);


/**
 * A factory for diagram-js shapes
 */
function ElementFactory() {
  this._uid = 12;
}

module.exports = ElementFactory;


ElementFactory.prototype.createRoot = function(attrs) {
  return this.create('root', attrs);
};

ElementFactory.prototype.createLabel = function(attrs) {
  return this.create('label', attrs);
};

ElementFactory.prototype.createShape = function(attrs) {
  return this.create('shape', attrs);
};

ElementFactory.prototype.createConnection = function(attrs) {
  return this.create('connection', attrs);
};

/**
 * Create a model element with the given type and
 * a number of pre-set attributes.
 *
 * @param  {String} type
 * @param  {Object} attrs
 * @return {djs.model.Base} the newly created model instance
 */
ElementFactory.prototype.create = function(type, attrs) {

  attrs = attrs || {};

  if (!attrs.id) {
    attrs.id = type + '_' + (this._uid++);
  }

  return Model.create(type, attrs);
};
},{}],66:[function(_dereq_,module,exports){
'use strict';

var ELEMENT_ID = 'data-element-id';

/**
 * @class
 *
 * A registry that keeps track of all shapes in the diagram.
 */
function ElementRegistry() {
  this._elements = {};
}

module.exports = ElementRegistry;

/**
 * Register a pair of (element, gfx, (secondaryGfx)).
 *
 * @param {djs.model.Base} element
 * @param {Snap<SVGElement>} gfx
 * @param {Snap<SVGElement>} [secondaryGfx] optional other element to register, too
 */
ElementRegistry.prototype.add = function(element, gfx, secondaryGfx) {

  var id = element.id;

  if (!id) {
    throw new Error('element must have an id');
  }

  if (this._elements[id]) {
    throw new Error('element with id ' + id + ' already added');
  }

  // associate dom node with element
  gfx.attr(ELEMENT_ID, id);

  if (secondaryGfx) {
    secondaryGfx.attr(ELEMENT_ID, id);
  }

  this._elements[id] = { element: element, gfx: gfx, secondaryGfx: secondaryGfx };
};


/**
 * Removes an element from the registry.
 *
 * @param {djs.model.Base} element
 */
ElementRegistry.prototype.remove = function(element) {
  var elements = this._elements,
      id = element.id || element,
      container = id && elements[id];

  if (container) {

    // unset element id on gfx
    container.gfx.attr(ELEMENT_ID, null);

    if (container.secondaryGfx) {
      container.secondaryGfx.attr(ELEMENT_ID, null);
    }

    delete elements[id];
  }
};


/**
 * Return the model element for a given id or graphics.
 *
 * @example
 *
 * elementRegistry.get('SomeElementId_1');
 * elementRegistry.get(gfx);
 *
 *
 * @param {String|SVGElement} filter for selecting the element
 *
 * @return {djs.model.Base}
 */
ElementRegistry.prototype.get = function(filter) {
  var id;

  if (typeof filter === 'string') {
    id = filter;
  } else {
    id = filter && filter.attr(ELEMENT_ID);
  }

  var container = this._elements[id];
  return container && container.element;
};

/**
 * Return all elements that match a given filter function.
 *
 * @param {Function} fn
 *
 * @return {Array<djs.model.Base>}
 */
ElementRegistry.prototype.filter = function(fn) {

  var map = this._elements,
      filtered = [];

  Object.keys(map).forEach(function(id) {
    var container = map[id],
        element = container.element,
        gfx = container.gfx;

    if (fn(element, gfx)) {
      filtered.push(element);
    }
  });

  return filtered;
};

/**
 * Return the graphics for a given id or element.
 *
 * @example
 *
 * elementRegistry.getGraphics('SomeElementId_1');
 * elementRegistry.getGraphics(rootElement);
 *
 *
 * @param {String|djs.model.Base} filter
 *
 * @return {SVGElement}
 */
ElementRegistry.prototype.getGraphics = function(filter) {
  var id = filter.id || filter;

  var container = this._elements[id];
  return container && container.gfx;
};

},{}],67:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var DEFAULT_PRIORITY = 1000;

function Event() { }

Event.prototype = {
  stopPropagation: function() {
    this.propagationStopped = true;
  },
  preventDefault: function() {
    this.defaultPrevented = true;
  },
  init: function(data) {
    _.extend(this, data || {});
  }
};


/**
 * A general purpose event bus
 *
 * @class
 */
function EventBus() {
  this._listeners = {};

  // cleanup on destroy

  var self = this;

  // destroy on lowest priority to allow
  // message passing until the bitter end
  this.on('diagram.destroy', 1, function() {
    self._listeners = null;
  });
}

module.exports = EventBus;

module.exports.Event = Event;


/**
 * Register an event listener for events with the given name.
 *
 * The callback will be invoked with `event, ...additionalArguments`
 * that have been passed to {@link EventBus#fire}.
 *
 * Returning false from a listener will prevent the events default action
 * (if any is specified). To stop an event from being processed further in
 * other listeners execute {@link Event#stopPropagation}.
 *
 * @param {String|Array<String>} events
 * @param {Number} [priority=1000] the priority in which this listener is called, larger is higher
 * @param {Function} callback
 */
EventBus.prototype.on = function(events, priority, callback) {

  events = _.isArray(events) ? events : [ events ];

  if (_.isFunction(priority)) {
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!_.isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  var self = this,
      listener = { priority: priority, callback: callback };

  events.forEach(function(e) {
    self._addListener(e, listener);
  });
};


/**
 * Register an event listener that is executed only once.
 *
 * @param {String} event the event name to register for
 * @param {Function} callback the callback to execute
 */
EventBus.prototype.once = function(event, callback) {

  var self = this;

  function wrappedCallback() {
    callback.apply(self, arguments);
    self.off(event, wrappedCallback);
  }

  this.on(event, wrappedCallback);
};


/**
 * Removes event listeners by event and callback.
 *
 * If no callback is given, all listeners for a given event name are being removed.
 *
 * @param {String} event
 * @param {Function} [callback]
 */
EventBus.prototype.off = function(event, callback) {
  var listeners = this._getListeners(event),
      l, i;

  if (callback) {

    // move through listeners from back to front
    // and remove matching listeners
    for (i = listeners.length - 1; !!(l = listeners[i]); i--) {
      if (l.callback === callback) {
        listeners.splice(i, 1);
      }
    }
  } else {
    // clear listeners
    listeners.length = 0;
  }
};


/**
 * Fires a named event.
 *
 * @example
 *
 * // fire event by name
 * events.fire('foo');
 *
 * // fire event object with nested type
 * var event = { type: 'foo' };
 * events.fire(event);
 *
 * // fire event with explicit type
 * var event = { x: 10, y: 20 };
 * events.fire('element.moved', event);
 *
 * // pass additional arguments to the event
 * events.on('foo', function(event, bar) {
 *   alert(bar);
 * });
 *
 * events.fire({ type: 'foo' }, 'I am bar!');
 *
 * @param {String} [name] the optional event name
 * @param {Object} [event] the event object
 * @param {...Object} additional arguments to be passed to the callback functions
 *
 * @return {Boolean} false if default was prevented, null if the propagation got stopped and true otherwise
 */
EventBus.prototype.fire = function(type, data) {

  var event,
      originalType,
      listeners, i, l,
      args;

  args = Array.prototype.slice.call(arguments);

  if (typeof type === 'string') {
    // remove name parameter
    args.shift();
  } else {
    event = type;
    type = event.type;
  }

  if (!type) {
    throw new Error('no event type specified');
  }

  listeners = this._listeners[type];

  if (!listeners) {
    return true;
  }

  // we make sure we fire instances of our home made
  // events here. We wrap them only once, though
  if (data instanceof Event) {
    // we are fine, we alread have an event
    event = data;
  } else {
    event = Object.create(Event.prototype);
    event.init(data);
  }

  // ensure we pass the event as the first parameter
  args[0] = event;

  // original event type (in case we delegate)
  originalType = event.type;

  try {

    // update event type before delegation
    if (type !== originalType) {
      event.type = type;
    }

    for (i = 0, l; !!(l = listeners[i]); i++) {

      // handle stopped propagation
      if (event.propagationStopped) {
        break;
      }

      try {
        // handle listener returning false
        if (l.callback.apply(null, args) === false) {
          event.preventDefault();
        }
      } catch (e) {
        if (!this.handleError(e)) {
          console.error('unhandled error in event listener');
          console.error(e.stack);

          throw e;
        }
      }
    }
  } finally {
    // reset event type after delegation
    if (type !== originalType) {
      event.type = originalType;
    }
  }

  // distinguish between default prevented (false)
  // and propagation stopped (null) as a return value
  return event.defaultPrevented ? false : (event.propagationStopped ? null : true);
};


EventBus.prototype.handleError = function(error) {
  return !this.fire('error', { error: error });
};


EventBus.prototype._addListener = function(event, listener) {

  var listeners = this._getListeners(event),
      i, l;

  // ensure we order listeners by priority from
  // 0 (high) to n > 0 (low)
  for (i = 0; !!(l = listeners[i]); i++) {
    if (l.priority < listener.priority) {
      listeners.splice(i, 0, listener);
      return;
    }
  }

  listeners.push(listener);
};


EventBus.prototype._getListeners = function(name) {
  var listeners = this._listeners[name];

  if (!listeners) {
    this._listeners[name] = listeners = [];
  }

  return listeners;
};

},{}],68:[function(_dereq_,module,exports){
var _ = (window._);

var GraphicsUtil = _dereq_(154),
    Dom = _dereq_(150);


/**
 * A factory that creates graphical elements
 *
 * @param {Renderer} renderer
 * @param {Snap} snap
 */
function GraphicsFactory(renderer, elementRegistry, snap) {
  this._renderer = renderer;
  this._elementRegistry = elementRegistry;
  this._snap = snap;
}

GraphicsFactory.$inject = [ 'renderer', 'elementRegistry', 'snap' ];

module.exports = GraphicsFactory;


GraphicsFactory.prototype._getChildren = function(element) {

  var gfx = this._elementRegistry.getGraphics(element);

  var childrenGfx;

  // root element
  if (!element.parent) {
    childrenGfx = gfx;
  } else {
    childrenGfx = GraphicsUtil.getChildren(gfx);
    if (!childrenGfx) {
      childrenGfx = gfx.parent().group().attr('class', 'djs-children');
    }
  }

  return childrenGfx;
};

/**
 * Clears the graphical representation of the element and returns the
 * cleared visual (the <g class="djs-visual" /> element).
 */
GraphicsFactory.prototype._clear = function(gfx) {
  var visual = GraphicsUtil.getVisual(gfx);

  Dom.clear(visual.node);

  return visual;
};

/**
 * Creates a gfx container for shapes and connections
 *
 * The layout is as follows:
 *
 * <g class="djs-group">
 *
 *   <!-- the gfx -->
 *   <g class="djs-element djs-(shape|connection)">
 *     <g class="djs-visual">
 *       <!-- the renderer draws in here -->
 *     </g>
 *
 *     <!-- extensions (overlays, click box, ...) goes here
 *   </g>
 *
 *   <!-- the gfx child nodes -->
 *   <g class="djs-children"></g>
 * </g>
 *
 * @param {Object} parent
 * @param {String} type the type of the element, i.e. shape | connection
 */
GraphicsFactory.prototype._createContainer = function(type, parentGfx) {
  var outerGfx = parentGfx.group().attr('class', 'djs-group'),
      gfx = outerGfx.group().attr('class', 'djs-element djs-' + type);

  // create visual
  gfx.group().attr('class', 'djs-visual');

  return gfx;
};

GraphicsFactory.prototype.create = function(type, element) {
  var childrenGfx = this._getChildren(element.parent);
  return this._createContainer(type, childrenGfx);
};


GraphicsFactory.prototype.updateContainments = function(elements) {

  var self = this,
      elementRegistry = this._elementRegistry,
      parents;


  parents = _.reduce(elements, function(map, e) {

    if (e.parent) {
      map[e.parent.id] = e.parent;
    }

    return map;
  }, {});

  // update all parents of changed and reorganized their children
  // in the correct order (as indicated in our model)
  _.forEach(parents, function(parent) {

    var childGfx = self._getChildren(parent),
        children = parent.children;

    if (!children) {
      return;
    }

    _.forEach(children.slice().reverse(), function(c) {
      var gfx = elementRegistry.getGraphics(c);
      gfx.parent().prependTo(childGfx);
    });
  });

};

GraphicsFactory.prototype.update = function(type, element, gfx) {

  var visual = this._clear(gfx);

  // redraw
  if (type === 'shape') {
    this._renderer.drawShape(visual, element);

    // update positioning
    gfx.translate(element.x, element.y);
  } else
  if (type === 'connection') {
    this._renderer.drawConnection(visual, element);
  } else {
    throw new Error('unknown type: ' + type);
  }

  gfx.attr('display', element.hidden ? 'none' : 'block');
};


GraphicsFactory.prototype.remove = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  // remove
  gfx.parent().remove();
};
},{}],69:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(73) ],
  __init__: [ 'canvas' ],
  canvas: [ 'type', _dereq_(64) ],
  elementRegistry: [ 'type', _dereq_(66) ],
  elementFactory: [ 'type', _dereq_(65) ],
  eventBus: [ 'type', _dereq_(67) ],
  graphicsFactory: [ 'type', _dereq_(68) ]
};
},{}],70:[function(_dereq_,module,exports){
'use strict';

var Snap = _dereq_(71);


/**
 * The default renderer used for shapes and connections.
 *
 * @param {Styles} styles
 */
function Renderer(styles) {
  this.CONNECTION_STYLE = styles.style([ 'no-fill' ], { strokeWidth: 5, stroke: 'fuchsia' });
  this.SHAPE_STYLE = styles.style({ fill: 'white', stroke: 'fuchsia', strokeWidth: 2 });
}

module.exports = Renderer;

Renderer.$inject = ['styles'];


Renderer.prototype.drawShape = function drawShape(gfxGroup, data) {
  return gfxGroup.rect(0, 0, data.width || 0, data.height || 0, 10, 10).attr(this.SHAPE_STYLE);
};

Renderer.prototype.drawConnection = function drawConnection(gfxGroup, data) {
  return createLine(data.waypoints, this.CONNECTION_STYLE).appendTo(gfxGroup);
};


function toSVGPoints(points) {
  var result = '';

  for (var i = 0, p; !!(p = points[i]); i++) {
    result += p.x + ',' + p.y + ' ';
  }

  return result;
}

function createLine(points, attrs) {
  return Snap.create('polyline', { points: toSVGPoints(points) }).attr(attrs || {});
}

function updateLine(gfx, points) {
  return gfx.attr({ points: toSVGPoints(points) });
}

module.exports.createLine = createLine;
module.exports.updateLine = updateLine;
},{}],71:[function(_dereq_,module,exports){
var snapsvg = (window.Snap);

// require snapsvg extensions
_dereq_(74);

module.exports = snapsvg;
},{}],72:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * A component that manages shape styles
 */
function Styles() {

  var defaultTraits = {

    'no-fill': {
      fill: 'none'
    },
    'no-border': {
      strokeOpacity: 0.0
    },
    'no-events': {
      pointerEvents: 'none'
    }
  };

  /**
   * Builds a style definition from a className, a list of traits and an object of additional attributes.
   *
   * @param  {String} className
   * @param  {Array<String>} traits
   * @param  {Object} additionalAttrs
   *
   * @return {Object} the style defintion
   */
  this.cls = function(className, traits, additionalAttrs) {
    var attrs = this.style(traits, additionalAttrs);

    return _.extend(attrs, { 'class': className });
  };

  /**
   * Builds a style definition from a list of traits and an object of additional attributes.
   *
   * @param  {Array<String>} traits
   * @param  {Object} additionalAttrs
   *
   * @return {Object} the style defintion
   */
  this.style = function(traits, additionalAttrs) {

    if (!_.isArray(traits) && !additionalAttrs) {
      additionalAttrs = traits;
      traits = [];
    }

    var attrs = _.inject(traits, function(attrs, t) {
      return _.extend(attrs, defaultTraits[t] || {});
    }, {});

    return additionalAttrs ? _.extend(attrs, additionalAttrs) : attrs;
  };
}

module.exports = Styles;
},{}],73:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  renderer: [ 'type', _dereq_(70) ],
  snap: [ 'value', _dereq_(71) ],
  styles: [ 'type', _dereq_(72) ]
};
},{}],74:[function(_dereq_,module,exports){
'use strict';

var Snap = (window.Snap);

Snap.plugin(function(Snap, Element) {

  /*\
   * Element.children
   [ method ]
   **
   * Returns array of all the children of the element.
   = (array) array of Elements
  \*/
  Element.prototype.children = function () {
      var out = [],
          ch = this.node.childNodes;
      for (var i = 0, ii = ch.length; i < ii; i++) {
          out[i] = new Snap(ch[i]);
      }
      return out;
  };
});


/**
 * @class ClassPlugin
 *
 * Extends snapsvg with methods to add and remove classes
 */
Snap.plugin(function (Snap, Element, Paper, global) {

  function split(str) {
    return str.split(/\s+/);
  }

  function join(array) {
    return array.join(' ');
  }

  function getClasses(e) {
    return split(e.attr('class') || '');
  }

  function setClasses(e, classes) {
    e.attr('class', join(classes));
  }

  /**
   * @method snapsvg.Element#addClass
   *
   * @example
   *
   * e.attr('class', 'selector');
   *
   * e.addClass('foo bar'); // adds classes foo and bar
   * e.attr('class'); // -> 'selector foo bar'
   *
   * e.addClass('fooBar');
   * e.attr('class'); // -> 'selector foo bar fooBar'
   *
   * @param {String} cls classes to be added to the element
   *
   * @return {snapsvg.Element} the element (this)
   */
  Element.prototype.addClass = function(cls) {
    var current = getClasses(this),
        add = split(cls),
        i, e;

    for (i = 0, e; !!(e = add[i]); i++) {
      if (current.indexOf(e) === -1) {
        current.push(e);
      }
    }

    setClasses(this, current);

    return this;
  };

  /**
   * @method snapsvg.Element#hasClass
   *
   * @param  {String}  cls the class to query for
   * @return {Boolean} returns true if the element has the given class
   */
  Element.prototype.hasClass = function(cls) {
    if (!cls) {
      throw new Error('[snapsvg] syntax: hasClass(clsStr)');
    }

    return getClasses(this).indexOf(cls) !== -1;
  };

  /**
   * @method snapsvg.Element#removeClass
   *
   * @example
   *
   * e.attr('class', 'foo bar');
   *
   * e.removeClass('foo');
   * e.attr('class'); // -> 'bar'
   *
   * e.removeClass('foo bar'); // removes classes foo and bar
   * e.attr('class'); // -> ''
   *
   * @param {String} cls classes to be removed from element
   *
   * @return {snapsvg.Element} the element (this)
   */
  Element.prototype.removeClass = function(cls) {
    var current = getClasses(this),
        remove = split(cls),
        i, e, idx;

    for (i = 0, e; !!(e = remove[i]); i++) {
      idx = current.indexOf(e);

      if (idx !== -1) {
        // remove element from array
        current.splice(idx, 1);
      }
    }

    setClasses(this, current);

    return this;
  };

});

/**
 * @class TranslatePlugin
 *
 * Extends snapsvg with methods to translate elements
 */
Snap.plugin(function (Snap, Element, Paper, global) {

  /*
   * @method snapsvg.Element#translate
   *
   * @example
   *
   * e.translate(10, 20);
   *
   * // sets transform matrix to translate(10, 20)
   *
   * @param {Number} x translation
   * @param {Number} y translation
   *
   * @return {snapsvg.Element} the element (this)
   */
  Element.prototype.translate = function(x, y) {
    var matrix = new Snap.Matrix();
    matrix.translate(x, y);
    return this.transform(matrix);
  };
});


/**
 * @class CreatePlugin
 *
 * Create an svg element without attaching it to the dom
 */
Snap.plugin(function(Snap) {

  Snap.create = function(name, attrs) {
    return Snap._.wrap(Snap._.$(name, attrs));
  };
});


/**
 * @class CreatSnapAtPlugin
 *
 * Extends snap.svg with a method to create a SVG element
 * at a specific position in the DOM.
 */
Snap.plugin(function(Snap, Element, Paper, global) {

  /*
   * @method snapsvg.createSnapAt
   *
   * @example
   *
   * snapsvg.createSnapAt(parentNode, 200, 200);
   *
   * @param {Number} width of svg
   * @param {Number} height of svg
   * @param {Object} parentNode svg Element will be child of this
   *
   * @return {snapsvg.Element} the newly created wrapped SVG element instance
   */
  Snap.createSnapAt = function(width, height, parentNode) {

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    if (!parentNode) {
      parentNode = document.body;
    }
    parentNode.appendChild(svg);

    return new Snap(svg);
  };
});
},{}],75:[function(_dereq_,module,exports){
var _ = (window._);

var Geometry = _dereq_(153),
    Util = _dereq_(78);

var MARKER_OK = 'connect-ok',
    MARKER_NOT_OK = 'connect-not-ok',
    MARKER_CONNECT_HOVER = 'connect-hover',
    MARKER_CONNECT_UPDATING = 'djs-updating';

var COMMAND_BENDPOINT_UPDATE = 'connection.updateWaypoints',
    COMMAND_RECONNECT_START = 'connection.reconnectStart',
    COMMAND_RECONNECT_END = 'connection.reconnectEnd';

/**
 * A component that implements moving of bendpoints
 */
function BendpointMove(injector, eventBus, canvas, dragging, graphicsFactory, rules, modeling) {

  var connectionDocking;

  // optional connection docking integration
  try {
    connectionDocking = injector.get('connectionDocking');
  } catch (e) {}


  // API

  this.start = function(event, connection, bendpointIndex, insert) {

    var type,
        context,
        waypoints = connection.waypoints,
        gfx = canvas.getGraphics(connection);

    if (!insert && bendpointIndex === 0) {
      type = COMMAND_RECONNECT_START;
    } else
    if (!insert && bendpointIndex === waypoints.length - 1) {
      type = COMMAND_RECONNECT_END;
    } else {
      type = COMMAND_BENDPOINT_UPDATE;
    }

    context = {
      connection: connection,
      bendpointIndex: bendpointIndex,
      insert: insert,
      type: type
    };

    dragging.activate(event, 'bendpoint.move', {
      data: {
        connection: connection,
        connectionGfx: gfx,
        context: context
      }
    });
  };


  // DRAGGING IMPLEMENTATION


  function redrawConnection(data) {
    graphicsFactory.update('connection', data.connection, data.connectionGfx);
  }

  function filterRedundantWaypoints(waypoints) {
    return waypoints.filter(function(r, idx) {
      return !Geometry.pointsOnLine(waypoints[idx - 1], waypoints[idx + 1], r);
    });
  }

  eventBus.on('bendpoint.move.start', function(e) {

    var context = e.context,
        connection = context.connection,
        originalWaypoints = connection.waypoints,
        waypoints = originalWaypoints.slice(),
        insert = context.insert,
        idx = context.bendpointIndex;

    context.originalWaypoints = originalWaypoints;

    if (insert) {
      // insert placeholder for bendpoint to-be-added
      waypoints.splice(idx, 0, null);
    }

    connection.waypoints = waypoints;

    // add dragger gfx
    context.draggerGfx = Util.addBendpoint(canvas.getLayer('overlays'));
    context.draggerGfx.addClass('djs-dragging');

    canvas.addMarker(connection, MARKER_CONNECT_UPDATING);
  });

  eventBus.on('bendpoint.move.hover', function(e) {
    e.context.hover = e.hover;

    canvas.addMarker(e.hover, MARKER_CONNECT_HOVER);
  });

  eventBus.on([
    'bendpoint.move.out',
    'bendpoint.move.cleanup'
  ], function(e) {

    // remove connect marker
    // if it was added
    var hover = e.context.hover;

    if (hover) {
      canvas.removeMarker(hover, MARKER_CONNECT_HOVER);
      canvas.removeMarker(hover, e.context.target ? MARKER_OK : MARKER_NOT_OK);
    }
  });

  eventBus.on('bendpoint.move.move', function(e) {

    var context = e.context,
        connection = e.connection;

    connection.waypoints[context.bendpointIndex] = { x: e.x, y: e.y };

    if (connectionDocking) {
      connection.waypoints = connectionDocking.getCroppedWaypoints(connection);
    }

    // asks whether reconnect / bendpoint move / bendpoint add
    // is allowed at the given position
    var allowed = context.allowed = rules.allowed(context.type, context);

    if (allowed) {

      if (context.hover) {
        canvas.removeMarker(context.hover, MARKER_NOT_OK);
        canvas.addMarker(context.hover, MARKER_OK);

        context.target = context.hover;
      }
    } else
    if (allowed === false) {
      if (context.hover) {
        canvas.removeMarker(context.hover, MARKER_OK);
        canvas.addMarker(context.hover, MARKER_NOT_OK);

        context.target = null;
      }
    }

    // add dragger gfx
    context.draggerGfx.translate(e.x, e.y);

    redrawConnection(e);
  });

  eventBus.on([
    'bendpoint.move.end',
    'bendpoint.move.cancel'
  ], function(e) {

    var context = e.context,
        connection = context.connection;

    // remove dragger gfx
    context.draggerGfx.remove();

    context.newWaypoints = _.clone(connection.waypoints);

    connection.waypoints = context.originalWaypoints;

    canvas.removeMarker(connection, MARKER_CONNECT_UPDATING);
  });

  eventBus.on('bendpoint.move.end', function(e) {

    var context = e.context,
        waypoints = context.newWaypoints,
        bendpointIndex = context.bendpointIndex,
        bendpoint = waypoints[bendpointIndex],
        allowed = context.allowed;

    if (allowed === true && context.type === COMMAND_RECONNECT_START) {
      modeling.reconnectStart(context.connection, context.target, bendpoint);
    } else
    if (allowed === true && context.type === COMMAND_RECONNECT_END) {
      modeling.reconnectEnd(context.connection, context.target, bendpoint);
    } else
    if (allowed !== false && context.type === COMMAND_BENDPOINT_UPDATE) {
      modeling.updateWaypoints(context.connection, filterRedundantWaypoints(waypoints));
    } else {
      redrawConnection(e);
    }
  });

  eventBus.on('bendpoint.move.cancel', function(e) {
    redrawConnection(e);
  });
}

BendpointMove.$inject = [ 'injector', 'eventBus', 'canvas', 'dragging', 'graphicsFactory', 'rules', 'modeling' ];

module.exports = BendpointMove;
},{}],76:[function(_dereq_,module,exports){
var _ = (window._),
    Snap = (window.Snap);


function BendpointSnapping(eventBus) {

  function snapTo(candidates, point) {
    return Snap.snapTo(candidates, point);
  }

  function toPoint(e) {
    return _.pick(e, [ 'x', 'y' ]);
  }

  function mid(element) {
    if (element.width) {
      return {
        x: element.width / 2 + element.x,
        y: element.height / 2 + element.y
      };
    }
  }

  function getSnapPoints(context) {

    var snapPoints = context.snapPoints,
        waypoints = context.connection.waypoints,
        bendpointIndex = context.bendpointIndex,
        referenceWaypoints = [ waypoints[bendpointIndex - 1], waypoints[bendpointIndex + 1] ];

    if (!snapPoints) {
      context.snapPoints = snapPoints = { horizontal: [] , vertical: [] };

      _.forEach(referenceWaypoints, function(p) {
        // we snap on existing bendpoints only,
        // not placeholders that are inserted during add
        if (p) {
          p = p.original || p;

          snapPoints.horizontal.push(p.y);
          snapPoints.vertical.push(p.x);
        }
      });
    }

    return snapPoints;
  }

  eventBus.on('bendpoint.move.start', function(event) {
    event.context.snapStart = toPoint(event);
  });

  eventBus.on('bendpoint.move.move', 1500, function(event) {

    var context = event.context,
        snapPoints = getSnapPoints(context),
        start = context.snapStart,
        target = context.target,
        targetMid = target && mid(target),
        x = start.x + event.dx,
        y = start.y + event.dy,
        sx, sy;

    if (!snapPoints) {
      return;
    }

    // snap
    sx = snapTo(targetMid ? snapPoints.vertical.concat([ targetMid.x ]) : snapPoints.vertical, x);
    sy = snapTo(targetMid ? snapPoints.horizontal.concat([ targetMid.y ]) : snapPoints.horizontal, y);


    // correction x/y
    var cx = (x - sx),
        cy = (y - sy);

    // update delta
    _.extend(event, {
      dx: event.dx - cx,
      dy: event.dy - cy,
      x: event.x - cx,
      y: event.y - cy
    });
  });
}


BendpointSnapping.$inject = [ 'eventBus' ];

module.exports = BendpointSnapping;
},{}],77:[function(_dereq_,module,exports){
var Dom = _dereq_(150),
    Util = _dereq_(78);

var BENDPOINT_CLS = Util.BENDPOINT_CLS;


/**
 * A service that adds editable bendpoints to connections.
 */
function Bendpoints(injector, eventBus, canvas, interactionEvents, bendpointMove) {

  function getConnectionIntersection(waypoints, event) {
    var localPosition = Util.toCanvasCoordinates(canvas, event);
    return Util.getApproxIntersection(waypoints, localPosition);
  }

  function activateBendpointMove(event, connection) {
    var waypoints = connection.waypoints,
        intersection = getConnectionIntersection(waypoints, event);

    if (!intersection) {
      return;
    }

    bendpointMove.start(event, connection, intersection.index, !intersection.bendpoint);
  }

  function getBendpointsContainer(element, create) {

    var layer = canvas.getLayer('overlays'),
        gfx = layer.select('.djs-bendpoints[data-element-id=' + element.id + ']');

    if (!gfx && create) {
      gfx = layer.group().addClass('djs-bendpoints').attr('data-element-id', element.id);

      Dom.on(gfx.node, 'mousedown', function(event) {
        activateBendpointMove(event, element);
      });
    }

    return gfx;
  }

  function createBendpoints(gfx, connection) {
    connection.waypoints.forEach(function(p, idx) {
      Util.addBendpoint(gfx).translate(p.x, p.y);
    });

    // add floating bendpoint
    Util.addBendpoint(gfx).addClass('floating');
  }

  function clearBendpoints(gfx) {
    gfx.selectAll('.' + BENDPOINT_CLS).forEach(function(s) {
      s.remove();
    });
  }

  function addBendpoints(connection) {
    var gfx = getBendpointsContainer(connection);

    if (!gfx) {
      gfx = getBendpointsContainer(connection, true);
      createBendpoints(gfx, connection);
    }

    return gfx;
  }

  function updateBendpoints(connection) {

    var gfx = getBendpointsContainer(connection);

    if (gfx) {
      clearBendpoints(gfx);
      createBendpoints(gfx, connection);
    }
  }

  eventBus.on('connection.changed', function(event) {
    updateBendpoints(event.element);
  });

  eventBus.on('connection.remove', function(event) {
    var gfx = getBendpointsContainer(event.element);
    if (gfx) {
      gfx.remove();
    }
  });

  eventBus.on('element.marker.update', function(event) {

    var element = event.element,
        bendpointsGfx;

    if (!element.waypoints) {
      return;
    }

    bendpointsGfx = addBendpoints(element);
    bendpointsGfx[event.add ? 'addClass' : 'removeClass'](event.marker);
  });

  eventBus.on('element.mousemove', function(event) {

    var element = event.element,
        waypoints = element.waypoints,
        bendpointsGfx,
        floating,
        intersection;

    if (waypoints) {

      bendpointsGfx = getBendpointsContainer(element, true);
      floating = bendpointsGfx.select('.floating');

      if (!floating) {
        return;
      }

      intersection = getConnectionIntersection(waypoints, event.originalEvent);

      if (intersection) {
        floating.translate(intersection.point.x, intersection.point.y);
      }
    }
  });

  eventBus.on('element.mousedown', function(event) {

    var originalEvent = event.originalEvent,
        element = event.element,
        waypoints = element.waypoints;

    if (!waypoints) {
      return;
    }

    activateBendpointMove(originalEvent, element, waypoints);
  });

  eventBus.on('selection.changed', function(event) {
    var newSelection = event.newSelection,
        primary = newSelection[0];

    if (primary && primary.waypoints) {
      addBendpoints(primary);
    }
  });

  eventBus.on('element.hover', function(event) {
    var element = event.element;

    if (element.waypoints) {
      addBendpoints(element);

      Dom.on(event.gfx.node, 'mousemove', interactionEvents.mouseHandler('element.mousemove'));
    }
  });

  eventBus.on('element.out', function(event) {
    Dom.off(event.gfx.node, 'mousemove', interactionEvents.mouseHandler('element.mousemove'));
  });
}

Bendpoints.$inject = [ 'injector', 'eventBus', 'canvas', 'interactionEvents', 'bendpointMove' ];

module.exports = Bendpoints;
},{}],78:[function(_dereq_,module,exports){
var Snap = (window.Snap);

var Events = _dereq_(152),
    Geometry = _dereq_(153);

var BENDPOINT_CLS = module.exports.BENDPOINT_CLS = 'djs-bendpoint';

module.exports.toCanvasCoordinates = function(canvas, event) {

  var position = Events.toPoint(event),
      clientRect = canvas._container.getBoundingClientRect(),
      offset;

  // canvas relative position

  offset = {
    x: clientRect.left,
    y: clientRect.top
  };

  // update actual event payload with canvas relative measures

  var viewbox = canvas.viewbox();

  return {
    x: viewbox.x + (position.x - offset.x) / viewbox.scale,
    y: viewbox.y + (position.y - offset.y) / viewbox.scale
  };
};

module.exports.addBendpoint = function(parentGfx) {
  var groupGfx = parentGfx.group().addClass(BENDPOINT_CLS);

  groupGfx.circle(0, 0, 4).addClass('djs-visual');
  groupGfx.circle(0, 0, 10).addClass('djs-hit');

  return groupGfx;
};


function circlePath(center, r) {
  var x = center.x,
      y = center.y;

  return [
    ['M', x, y],
    ['m', 0, -r],
    ['a', r, r, 0, 1, 1, 0, 2 * r],
    ['a', r, r, 0, 1, 1, 0, -2 * r],
    ['z']
  ];
}

function linePath(points) {
  var segments = [];

  points.forEach(function(p, idx) {
    segments.push([ idx === 0 ? 'M' : 'L', p.x, p.y ]);
  });

  return segments;
}


var INTERSECTION_THRESHOLD = 10;

function getBendpointIntersection(waypoints, reference) {

  var i, w;

  for (i = 0; !!(w = waypoints[i]); i++) {

    if (Geometry.distance(w, reference) <= INTERSECTION_THRESHOLD) {
      return {
        point: waypoints[i],
        bendpoint: true,
        index: i
      };
    }
  }

  return null;
}

function getPathIntersection(waypoints, reference) {

  var intersections = Snap.path.intersection(circlePath(reference, INTERSECTION_THRESHOLD), linePath(waypoints));

  var a = intersections[0],
      b = intersections[intersections.length - 1],
      idx;

  if (!a) {
    // no intersection
    return null;
  }

  if (a !== b) {

    if (a.segment2 !== b.segment2) {
      // we use the bendpoint in between both segments
      // as the intersection point

      idx = Math.max(a.segment2, b.segment2) - 1;

      return {
        point: waypoints[idx],
        bendpoint: true,
        index: idx
      };
    }

    return {
      point: {
        x: (Math.round(a.x + b.x) / 2),
        y: (Math.round(a.y + b.y) / 2)
      },
      index: a.segment2
    };
  }

  return {
    point: {
      x: Math.round(a.x),
      y: Math.round(a.y)
    },
    index: a.segment2
  };
}

/**
 * Returns the closest point on the connection towards a given reference point.
 *
 * @param  {Array<Point>} waypoints
 * @param  {Point} reference
 *
 * @return {Object} intersection data (segment, point)
 */
module.exports.getApproxIntersection = function(waypoints, reference) {
  return getBendpointIntersection(waypoints, reference) || getPathIntersection(waypoints, reference);
};
},{}],79:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(89), _dereq_(129) ],
  __init__: [ 'bendpoints', 'bendpointSnapping' ],
  bendpoints: [ 'type', _dereq_(77) ],
  bendpointMove: [ 'type', _dereq_(75) ],
  bendpointSnapping: [ 'type', _dereq_(76) ]
};
},{}],80:[function(_dereq_,module,exports){
'use strict';

/**
 * Adds change support to the diagram, including
 *
 * <ul>
 *   <li>redrawing shapes and connections on change</li>
 * </ul>
 *
 * @param {EventBus} eventBus
 * @param {ElementRegistry} elementRegistry
 * @param {GraphicsFactory} graphicsFactory
 */
function ChangeSupport(eventBus, elementRegistry, graphicsFactory) {

  // redraw shapes / connections on change

  eventBus.on('element.changed', function(event) {

    var element = event.element;

    if (!event.gfx) {
      event.gfx = elementRegistry.getGraphics(element);
    }

    // shape + gfx may have been deleted
    if (!event.gfx) {
      return;
    }

    if (element.waypoints) {
      eventBus.fire('connection.changed', event);
    } else {
      eventBus.fire('shape.changed', event);
    }
  });

  eventBus.on('elements.changed', function(event) {

    var elements = event.elements;

    elements.forEach(function(e) {
      eventBus.fire('element.changed', { element: e });
    });

    graphicsFactory.updateContainments(elements);
  });

  eventBus.on('shape.changed', function(event) {
    graphicsFactory.update('shape', event.element, event.gfx);
  });

  eventBus.on('connection.changed', function(event) {
    graphicsFactory.update('connection', event.element, event.gfx);
  });
}

ChangeSupport.$inject = [ 'eventBus', 'elementRegistry', 'graphicsFactory' ];

module.exports = ChangeSupport;

},{}],81:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'changeSupport'],
  changeSupport: [ 'type', _dereq_(80) ]
};
},{}],82:[function(_dereq_,module,exports){
var LayoutUtil = _dereq_(141);

var MARKER_OK = 'connect-ok',
    MARKER_NOT_OK = 'connect-not-ok';


function Connect(eventBus, dragging, modeling, rules, elementRegistry, canvas) {

  // TODO(nre): separate UI and events

  // rules

  function canConnect(source, target) {
    return rules.allowed('connection.create', {
      source: source,
      target: target
    });
  }


  // layouting

  function crop(start, end, source, target) {

    var sourcePath = LayoutUtil.getShapePath(elementRegistry.getGraphics(source)),
        targetPath = target && LayoutUtil.getShapePath(elementRegistry.getGraphics(target)),
        connectionPath = LayoutUtil.getConnectionPath([ start, end ]);

    start = LayoutUtil.getElementLineIntersection(sourcePath, connectionPath, true) || start;
    end = (target && LayoutUtil.getElementLineIntersection(targetPath, connectionPath, false)) || end;

    return [ start, end ];
  }


  // event handlers

  eventBus.on('connect.move', function(event) {

    var context = event.context,
        source = context.source,
        target = context.target,
        visual = context.visual,
        start, end, waypoints;

    // update connection visuals during drag

    start = LayoutUtil.getMidPoint(source);

    end = {
      x: event.x,
      y: event.y
    };

    waypoints = crop(start, end, source, target);

    visual.attr('points', [ waypoints[0].x, waypoints[0].y, waypoints[1].x, waypoints[1].y ]);
  });

  eventBus.on('connect.hover', function(event) {
    var context = event.context,
        source = context.source,
        hover = event.hover,
        canExecute;

    canExecute = context.canExecute = canConnect(source, hover);

    // simply ignore hover
    if (canExecute === null) {
      return;
    }

    context.target = hover;

    canvas.addMarker(hover, canExecute ? MARKER_OK : MARKER_NOT_OK);
  });

  eventBus.on([ 'connect.out', 'connect.cleanup' ], function(event) {
    var context = event.context;

    if (context.target) {
      canvas.removeMarker(context.target, context.canExecute ? MARKER_OK : MARKER_NOT_OK);
    }

    context.target = null;
  });

  eventBus.on('connect.cleanup', function(event) {
    var context = event.context;

    if (context.visual) {
      context.visual.remove();
    }
  });

  eventBus.on('connect.start', function(event) {
    var context = event.context,
        visual;

    visual = canvas.getDefaultLayer().polyline().attr({
      'stroke': '#333',
      'strokeDasharray': [ 1 ],
      'strokeWidth': 2,
      'pointer-events': 'none'
    });

    context.visual = visual;
  });

  eventBus.on('connect.end', function(event) {

    var context = event.context,
        source = context.source,
        target = context.target,
        canExecute = context.canExecute || canConnect(source, target);

    if (canExecute) {
      modeling.connect(source, target);
    }
  });


  // API

  this.start = function(event, source, autoActivate) {

    dragging.activate(event, 'connect', {
      autoActivate: autoActivate,
      data: {
        shape: source,
        context: {
          source: source
        }
      }
    });
  };
}

Connect.$inject = [ 'eventBus', 'dragging', 'modeling', 'rules', 'elementRegistry', 'canvas' ];

module.exports = Connect;
},{}],83:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(133),
    _dereq_(129),
    _dereq_(89)
  ],
  connect: [ 'type', _dereq_(82) ]
};

},{}],84:[function(_dereq_,module,exports){
'use strict';

var _ = (window._),
    $ = (window.$);


/**
 * A context pad that displays element specific, contextual actions next
 * to a diagram element.
 *
 * @param {EventBus} eventBus
 * @param {Overlays} overlays
 */
function ContextPad(eventBus, overlays) {

  this._providers = [];

  this._eventBus = eventBus;
  this._overlays = overlays;

  this._current = null;

  this._init();
}

ContextPad.$inject = [ 'eventBus', 'overlays' ];

/**
 * Registers events needed for interaction with other components
 */
ContextPad.prototype._init = function() {

  var eventBus = this._eventBus;

  var self = this;

  eventBus.on('selection.changed', function(e) {

    var selection = e.newSelection;

    if (selection.length === 1) {
      self.open(selection[0]);
    } else {
      self.close();
    }
  });
};


/**
 * Register a provider with the context pad
 *
 * @param  {ContextPadProvider} provider
 */
ContextPad.prototype.registerProvider = function(provider) {
  this._providers.push(provider);
};


/**
 * Returns the context pad entries for a given element
 *
 * @param {djs.element.Base} element
 *
 * @return {Array<ContextPadEntryDescriptor>} list of entries
 */
ContextPad.prototype.getEntries = function(element) {
  var entries = {};

  // loop through all providers and their entries.
  // group entries by id so that overriding an entry is possible
  _.forEach(this._providers, function(provider) {
    var e = provider.getContextPadEntries(element);

    _.forEach(e, function(entry, id) {
      entries[id] = entry;
    });
  });

  return entries;
};


/**
 * Trigger an action available on the opened context pad
 *
 * @param  {String} action
 * @param  {Event} event
 */
ContextPad.prototype.trigger = function(action, event, autoActivate) {

  var current = this._current,
      element = current.element,
      entries = current.entries,
      entry,
      handler,
      originalEvent,
      button = $(event.target);

  button = button.is('.entry') ? button : button.parents('.djs-context-pad .entry');

  if (!button.length) {
    return event.preventDefault();
  }

  entry = entries[button.attr('data-action')];
  handler = entry.action;

  originalEvent = event.originalEvent || event;

  // simple action (via callback function)
  if (_.isFunction(handler)) {
    if (action === 'click') {
      return handler(originalEvent, element, autoActivate);
    }
  } else {
    if (handler[action]) {
      return handler[action](originalEvent, element, autoActivate);
    }
  }

  // silence other actions
  event.preventDefault();
};


/**
 * Open the context pad for the given element
 *
 * @param {djs.model.Base} element
 */
ContextPad.prototype.open = function(element) {

  if (this._current && this._current.open) {

    if (this._current.element === element) {
      // no change needed
      return;
    }

    this.close();
  }

  this._updateAndOpen(element);
};


ContextPad.prototype._updateAndOpen = function(element) {

  var pad = this.getPad(element);

  var entries = this.getEntries(element);

  var html = pad.html.html('');

  _.forEach(entries, function(entry, id) {
    var control = $(entry.html || '<div class="entry" draggable="true"></div>').attr('data-action', id);

    var grouping = entry.group || 'default';

    var container = html.find('[data-group=' + grouping + ']');
    if (!container.length) {
      container = $('<div class="group"></div>').attr('data-group', grouping).appendTo(html);
    }

    control.appendTo(container);

    if (entry.className) {
      control.addClass(entry.className);
    }

    if (entry.imageUrl) {
      control.append('<img src="' + entry.imageUrl + '">');
    }
  });

  html.addClass('open');

  this._current = {
    element: element,
    pad: pad,
    entries: entries,
    open: true
  };

  this._eventBus.fire('contextPad.open', { current: this._current });
};

ContextPad.prototype.getPad = function(element) {

  var self = this;

  var overlays = this._overlays;

  var pads = overlays.get({ element: element, type: 'context-pad' });

  // create context pad on demand if needed
  if (!pads.length) {

    var html = $('<div class="djs-context-pad"></div>');

    html.on('click', function(event) {
      self.trigger('click', event);
    });

    // stop propagation of mouse events
    html.on('mousedown', function(event) {
      event.stopPropagation();
    });

    html.on('dragstart', function(event) {
      self.trigger('dragstart', event);
    });

    overlays.add(element, 'context-pad', {
      position: {
        right: -9,
        top: -6
      },
      html: html
    });

    pads = overlays.get({ element: element, type: 'context-pad' });

    this._eventBus.fire('contextPad.create', { element: element, pad: pads[0] });
  }

  return pads[0];
};


/**
 * Close the context pad
 */
ContextPad.prototype.close = function() {
  if (this._current) {
    if (this._current.open) {
      this._current.pad.html.removeClass('open');
    }

    this._current.open = false;

    this._eventBus.fire('contextPad.close', { current: this._current });
  }
};


/**
 * Return the element the context pad is currently opened for,
 * if it is opened.
 *
 * @example
 *
 * contextPad.open(shape1);
 *
 * if (contextPad.isOpen()) {
 *   // yes, we are open
 * }
 *
 * @return {djs.model.Base} element
 */
ContextPad.prototype.isOpen = function() {
  return this._current && this._current.open;
};

module.exports = ContextPad;

},{}],85:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(91),
    _dereq_(121)
  ],
  contextPad: [ 'type', _dereq_(84) ]
};
},{}],86:[function(_dereq_,module,exports){

var MARKER_OK = 'drop-ok',
    MARKER_NOT_OK = 'drop-not-ok';


function Create(eventBus, dragging, rules, modeling, canvas, elementFactory, renderer, styles) {

  // rules

  function canCreate(shape, target, source) {

    if (source) {
      return rules.allowed('shape.append', {
        source: source,
        shape: shape,
        parent: target
      });
    } else {
      return rules.allowed('shape.create', {
        shape: shape,
        parent: target
      });
    }
  }


  // visual helpers

  function createVisual(shape) {
    var group, preview, visual;

    group = canvas.getDefaultLayer().group().attr(styles.cls('djs-drag-group', [ 'no-events' ]));

    preview = group.group().addClass('djs-dragger');

    preview.translate(shape.width / -2, shape.height / -2);

    visual = preview.group().addClass('djs-visual');

    // hijack renderer to draw preview
    renderer.drawShape(visual, shape);

    return group;
  }


  // event handlers

  eventBus.on('create.move', function(event) {

    var context = event.context,
        shape = context.shape,
        visual = context.visual;

    // lazy init drag visual once we received the first real
    // drag move event (this allows us to get the proper canvas local coordinates)
    if (!visual) {
      visual = context.visual = createVisual(shape);
    }

    visual.translate(event.x, event.y);

    var hover = event.hover,
        canExecute;

    canExecute = context.canExecute = hover && canCreate(context.shape, hover, context.source);

    // ignore hover visually if canExecute is null
    if (hover && canExecute !== null) {
      context.target = hover;
      canvas.addMarker(hover, canExecute ? MARKER_OK : MARKER_NOT_OK);
    }
  });

  eventBus.on('create.end', function(event) {
    var context = event.context,
        source = context.source,
        shape = context.shape,
        target = context.target,
        position = {
          x: event.x,
          y: event.y
        };

    if (context.canExecute) {

      var newShape;

      if (source) {
        newShape = modeling.appendShape(source, shape, position, target);
      } else {
        newShape = modeling.createShape(shape, position, target);
      }
    }
  });

  eventBus.on([ 'create.out', 'create.cleanup' ], function(event) {
    var context = event.context;

    if (context.target) {
      canvas.removeMarker(context.target, context.canExecute ? MARKER_OK : MARKER_NOT_OK);
    }
  });

  eventBus.on('create.cleanup', function(event) {
    var context = event.context;

    if (context.visual) {
      context.visual.remove();
    }
  });

  // API

  this.start = function(event, shape, source) {

    dragging.activate(event, 'create', {
      cursor: 'grabbing',
      autoActivate: true,
      data: {
        shape: shape,
        context: {
          shape: shape,
          source: source
        }
      }
    });
  };
}

Create.$inject = [ 'eventBus', 'dragging', 'rules', 'modeling', 'canvas', 'elementFactory', 'renderer', 'styles' ];

module.exports = Create;
},{}],87:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(89),
    _dereq_(133)
  ],
  create: [ 'type', _dereq_(86) ]
};
},{}],88:[function(_dereq_,module,exports){
/* global TouchEvent */

var _ = (window._);

var Dom = _dereq_(150),
    Event = _dereq_(152),
    Cursor = _dereq_(149);

function suppressEvent(event) {
  if (event instanceof MouseEvent) {
    Event.stopEvent(event, true);
  } else {
    Event.preventDefault(event);
  }
}

function getLength(point) {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
}

function substract(p1, p2) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y
  };
}


/**
 * A helper that fires canvas localized drag events and realizes
 * the general "drag-and-drop" look and feel.
 *
 * Calling {@link Dragging#activate} activates dragging on a canvas.
 *
 * It provides the following:
 *
 *   * emits the events `start`, `move`, `end`, `cancel` and `cleanup` via the {@link EventBus}.
 *     Each of the events is prefixed with a prefix that is assigned during activate.
 *   * sets and restores the cursor
 *   * sets and restores the selection
 *   * ensures there can be only one drag operation active at a time
 *
 * Dragging may be canceled manually by calling {@link Dragging#cancel} or by pressing ESC.
 *
 * @example
 *
 * function MyDragComponent(eventBus, dragging) {
 *
 *   eventBus.on('mydrag.start', function(event) {
 *     console.log('yes, we start dragging');
 *   });
 *
 *   eventBus.on('mydrag.move', function(event) {
 *     console.log('canvas local coordinates', event.x, event.y, event.dx, event.dy);
 *
 *     // local drag data is passed with the event
 *     event.context.foo; // "BAR"
 *
 *     // the original mouse event, too
 *     event.originalEvent; // MouseEvent(...)
 *   });
 *
 *   eventBus.on('element.click', function(event) {
 *     dragging.activate(event, 'mydrag', {
 *       cursor: 'grabbing',
 *       data: {
 *         context: {
 *           foo: "BAR"
 *         }
 *       }
 *     });
 *   });
 * }
 */
function Dragging(eventBus, canvas, selection) {

  var defaultOptions = {
    threshold: 5
  };

  // the currently active drag operation
  // dragging is active as soon as this context exists.
  //
  // it is visually _active_ only when a context.active flag is set to true.
  var context;


  // helpers

  function fire(type) {

    var ActualEvent = _dereq_(67).Event;

    var event = new ActualEvent();

    event.init(_.extend({}, context.payload, context.data));

    // default integration
    if (!eventBus.fire('drag.' + type, event)) {
      return false;
    }

    return eventBus.fire(context.prefix + '.' + type, event);
  }

  // event listeners

  function move(event, activate) {

    var payload = context.payload,
        start = context.start,
        position = Event.toPoint(event),
        delta = substract(position, start),
        clientRect = canvas._container.getBoundingClientRect(),
        offset;

    // canvas relative position

    offset = {
      x: clientRect.left,
      y: clientRect.top
    };

    // update actual event payload with canvas relative measures

    var viewbox = canvas.viewbox();

    var movement = {
      x: viewbox.x + (position.x - offset.x) / viewbox.scale,
      y: viewbox.y + (position.y - offset.y) / viewbox.scale,
      dx: delta.x / viewbox.scale,
      dy: delta.y / viewbox.scale
    };

    // activate context explicitly or once threshold is reached

    if (!context.active && (activate || getLength(delta) > context.threshold)) {

      // fire start event with original
      // starting coordinates

      _.extend(payload, {
        x: movement.x - movement.dx,
        y: movement.y - movement.dy,
        dx: 0,
        dy: 0
      }, { originalEvent: event });

      if (false === fire('start')) {
        return cancel();
      }

      context.active = true;

      // unset selection
      if (!context.keepSelection) {
        context.previousSelection = selection.get();
        selection.select(null);
      }
    }

    suppressEvent(event);

    if (context.active) {

      // fire move event with actual coordinates
      _.extend(payload, movement, { originalEvent: event });

      // allow custom cursor
      if (context.cursor) {
        Cursor.set(context.cursor);
      }

      fire('move');
    }
  }

  function end(event) {

    var restore = true;

    if (context.active) {

      if (event) {
        context.payload.originalEvent = event;

        // suppress original event (click, ...)
        // because we just ended a drag operation
        suppressEvent(event);
      }

      // implementations may stop restoring the
      // original state (selections, ...) by preventing the
      // end events default action
      restore = fire('end');
    }

    cleanup(restore);
  }


  // cancel active drag operation if the user presses
  // the ESC key on the keyboard

  function checkCancel(event) {

    if (event.which === 27) {
      event.preventDefault();

      cancel();
    }
  }


  // prevent ghost click that might occur after a finished
  // drag and drop session

  function trapClickAndEnd(event) {

    var untrap = function(e) {
      Dom.off(document, 'click', trap, true);
    };

    var trap = function(e) {
      suppressEvent(e);
      untrap();
    };

    if (context.active) {
      Dom.on(document, 'click', trap, true);
      setTimeout(untrap, 400);
    }

    end(event);
  }

  function trapTouch(event) {
    move(event);
  }

  // update the drag events hover (djs.model.Base) and hoverGfx (Snap<SVGElement>)
  // properties during hover and out and fire {prefix}.hover and {prefix}.out properties
  // respectively

  function hover(event) {
    var payload = context.payload;

    payload.hoverGfx = event.gfx;
    payload.hover = event.element;

    fire('hover');
  }

  function out(event) {
    fire('out');

    var payload = context.payload;

    payload.hoverGfx = null;
    payload.hover = null;
  }


  // life-cycle methods

  function cancel(restore) {

    if (!context) {
      return;
    }

    if (context.active) {
      fire('cancel');
    }

    cleanup(restore);
  }

  function cleanup(restore) {

    fire('cleanup');

    // reset cursor
    Cursor.unset();

    // reset dom listeners
    Dom.off(document, 'mousemove', move);

    Dom.off(document, 'mousedown', trapClickAndEnd, true);
    Dom.off(document, 'mouseup', end, true);

    Dom.off(document, 'keyup', checkCancel);

    Dom.off(document, 'touchstart', trapTouch, true);
    Dom.off(document, 'touchcancel', cancel, true);
    Dom.off(document, 'touchmove', move, true);
    Dom.off(document, 'touchend', end, true);

    eventBus.off('element.hover', hover);
    eventBus.off('element.out', out);

    // restore selection, unless it has changed
    if (restore !== false && context.previousSelection && !selection.get().length) {
      selection.select(context.previousSelection);
    }

    context = null;
  }

  function activate(event, prefix, options) {

    // only one drag operation may be active, at a time
    if (context) {
      cancel(false);
    }

    options = _.extend({}, defaultOptions, options || {});

    var data = options.data || {},
        originalEvent = Event.getOriginal(event) || event;

    context = _.extend({
      prefix: prefix,
      data: data,
      payload: {},
      start: Event.toPoint(event)
    }, options);

    // skip dom registration if trigger
    // is set to manual (during testing)
    if (!options.manual) {

      if (originalEvent instanceof MouseEvent) {
        // add dom listeners
        Dom.on(document, 'mousemove', move);

        Dom.on(document, 'mousedown', trapClickAndEnd, true);
        Dom.on(document, 'mouseup', end, true);
      } else
      if (originalEvent instanceof TouchEvent) {
        Dom.on(document, 'touchstart', trapTouch, true);
        Dom.on(document, 'touchcancel', cancel, true);
        Dom.on(document, 'touchmove', move, true);
        Dom.on(document, 'touchend', end, true);
      }

      Dom.on(document, 'keyup', checkCancel);

      eventBus.on('element.hover', hover);
      eventBus.on('element.out', out);
    }

    suppressEvent(event);

    fire('activate');

    if (options.autoActivate) {
      move(event, true);
    }
  }

  // cancel on diagram destruction
  eventBus.on('diagram.destroy', cancel);


  // API

  this.activate = activate;
  this.move = move;
  this.hover = hover;
  this.out = out;
  this.end = end;

  this.cancel = cancel;

  // for introspection

  this.active = function() {
    return context;
  };

  this.setOptions = function(options) {
    _.extend(defaultOptions, options);
  };
}

Dragging.$inject = [ 'eventBus', 'canvas', 'selection' ];

module.exports = Dragging;
},{}],89:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(133)
  ],
  dragging: [ 'type', _dereq_(88) ]
};
},{}],90:[function(_dereq_,module,exports){
'use strict';

var Snap = (window.Snap);

var Renderer = _dereq_(70),
    Dom = _dereq_(150),
    createLine = Renderer.createLine,
    updateLine = Renderer.updateLine;


/**
 * A plugin that provides interaction events for diagram elements.
 *
 * It emits the following events:
 *
 *   * element.hover
 *   * element.out
 *   * element.click
 *   * element.dblclick
 *   * element.mousedown
 *
 * Each event is a tuple { element, gfx, originalEvent }.
 *
 * Canceling the event via Event#preventDefault() prevents the original DOM operation.
 *
 * @param {EventBus} eventBus
 */
function InteractionEvents(eventBus, elementRegistry, styles, snap) {

  var HIT_STYLE = styles.cls('djs-hit', [ 'no-fill', 'no-border' ], {
    stroke: 'white',
    strokeWidth: 15
  });

  function fire(type, event) {
    var target = Dom.closest(event.target, 'svg, .djs-element'),
        gfx = target && snap(target),
        element = elementRegistry.get(gfx),
        defaultPrevented;

    if (!gfx || !element) {
      return;
    }

    defaultPrevented = eventBus.fire(type, { element: element, gfx: gfx, originalEvent: event });

    if (defaultPrevented) {
      event.preventDefault();
    }
  }

  var handlers = {};

  function mouseHandler(type) {

    var fn = handlers[type];

    if (!fn) {
      fn = handlers[type] = function(event) {
        // only indicate left mouse button=0 interactions
        if (!event.button) {
          fire(type, event);
        }
      };
    }

    return fn;
  }


  ///// event registration

  function registerEvents(svg) {

    var node = svg.node;

    /**
     * An event indicating that the mouse hovered over an element
     *
     * @event element.hover
     *
     * @type {Object}
     * @property {djs.model.Base} element
     * @property {Snap<Element>} gfx
     * @property {Event} originalEvent
     */
    Dom.on(node, 'mouseover', mouseHandler('element.hover'));

    /**
     * An event indicating that the mouse has left an element
     *
     * @event element.out
     *
     * @type {Object}
     * @property {djs.model.Base} element
     * @property {Snap<Element>} gfx
     * @property {Event} originalEvent
     */
    Dom.on(node, 'mouseout', mouseHandler('element.out'));

    /**
     * An event indicating that the mouse has clicked an element
     *
     * @event element.click
     *
     * @type {Object}
     * @property {djs.model.Base} element
     * @property {Snap<Element>} gfx
     * @property {Event} originalEvent
     */
    Dom.on(node, 'click', mouseHandler('element.click'));

    /**
     * An event indicating that the mouse has double clicked an element
     *
     * @event element.dblclick
     *
     * @type {Object}
     * @property {djs.model.Base} element
     * @property {Snap<Element>} gfx
     * @property {Event} originalEvent
     */
    Dom.on(node, 'dblclick', mouseHandler('element.dblclick'));

    /**
     * An event indicating that the mouse has gone down on an element.
     *
     * @event element.mousedown
     *
     * @type {Object}
     * @property {djs.model.Base} element
     * @property {Snap<Element>} gfx
     * @property {Event} originalEvent
     */
    Dom.on(node, 'mousedown', mouseHandler('element.mousedown'));

    /**
     * An event indicating that the mouse has gone up on an element.
     *
     * @event element.mouseup
     *
     * @type {Object}
     * @property {djs.model.Base} element
     * @property {Snap<Element>} gfx
     * @property {Event} originalEvent
     */
    Dom.on(node, 'mouseup', mouseHandler('element.mouseup'));
  }

  function unregisterEvents(svg) {

    var node = svg.node;

    Dom.off(node, 'mouseover', mouseHandler('element.hover'));
    Dom.off(node, 'mouseout', mouseHandler('element.out'));
    Dom.off(node, 'click', mouseHandler('element.click'));
    Dom.off(node, 'dblclick', mouseHandler('element.dblclick'));
    Dom.off(node, 'mousedown', mouseHandler('element.mousedown'));
    Dom.off(node, 'mouseup', mouseHandler('element.mouseup'));
  }

  eventBus.on('canvas.destroy', function(event) {
    unregisterEvents(event.svg);
  });

  eventBus.on('canvas.init', function(event) {
    registerEvents(event.svg);
  });


  eventBus.on([ 'shape.added', 'connection.added' ], function(event) {
    var element = event.element,
        gfx = event.gfx,
        hit,
        type;

    if (element.waypoints) {
      hit = createLine(element.waypoints);
      type = 'connection';
    } else {
      hit = Snap.create('rect', { x: 0, y: 0, width: element.width, height: element.height });
      type = 'shape';
    }

    hit.attr(HIT_STYLE).appendTo(gfx.node);
  });

  // update djs-hit on change

  eventBus.on('shape.changed', function(event) {

    var element = event.element,
        gfx = event.gfx,
        hit = gfx.select('.djs-hit');

    hit.attr({
      width: element.width,
      height: element.height
    });
  });

  eventBus.on('connection.changed', function(event) {

    var element = event.element,
        gfx = event.gfx,
        hit = gfx.select('.djs-hit');

    updateLine(hit, element.waypoints);
  });


  // API

  this.fire = fire;

  this.mouseHandler = mouseHandler;
}


InteractionEvents.$inject = [ 'eventBus', 'elementRegistry', 'styles', 'snap' ];

module.exports = InteractionEvents;

},{}],91:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'interactionEvents' ],
  interactionEvents: [ 'type', _dereq_(90) ]
};
},{}],92:[function(_dereq_,module,exports){
'use strict';

var Dom = _dereq_(150);

/**
 * A keyboard abstraction that may be activated and
 * deactivated by users at will, consuming key events
 * and triggering diagram actions.
 *
 * The implementation fires the following key events that allow
 * other components to hook into key handling:
 *
 *  - keyboard.bind
 *  - keyboard.unbind
 *  - keyboard.init
 *  - keyboard.destroy
 *
 * All events contain the fields (node, listeners).
 *
 * A default binding for the keyboard may be specified via the
 * `keyboard.bindTo` configuration option.
 *
 * @param {EventBus} eventBus
 * @param {CommandStack} commandStack
 * @param {Modeling} modeling
 * @param {Selection} selection
 */
function Keyboard(config, eventBus, commandStack, modeling, selection) {

  var self = this;

  this._commandStack = commandStack;
  this._modeling = modeling;
  this._selection = selection;
  this._eventBus = eventBus;

  this._listeners = [];

  // our key handler is a singleton that passes
  // (keycode, modifiers) to each listener.
  //
  // listeners must indicate that they handled a key event
  // by returning true. This stops the event propagation.
  //
  this._keyHandler = function(event) {
    var i, l,
        listeners = self._listeners,
        code = event.keyCode || event.charCode || -1;

    for (i = 0; !!(l = listeners[i]); i++) {
      if (l(code, event)) {
        event.stopPropagation();
      }
    }
  };

  // properly clean dom registrations
  eventBus.on('diagram.destroy', function() {
    self._fire('destroy');

    self.unbind();
    self._listeners = null;
  });

  eventBus.on('diagram.init', function() {
    self._fire('init');

    if (config && config.bindTo) {
      self.bind(config.bindTo);
    }
  });

  this._init();
}

Keyboard.$inject = [ 'config.keyboard', 'eventBus', 'commandStack', 'modeling', 'selection' ];

module.exports = Keyboard;


Keyboard.prototype.bind = function(node) {
  this._node = node;

  // bind key events
  Dom.on(node, 'keydown', this._keyHandler, true);

  this._fire('bind');
};

Keyboard.prototype.getBinding = function() {
  return this._node;
};

Keyboard.prototype.unbind = function() {
  var node = this._node;

  if (node) {
    this._fire('unbind');

    // unbind key events
    Dom.off(node, 'keydown', this._keyHandler, true);
  }

  this._node = null;
};


Keyboard.prototype._fire = function(event) {
  this._eventBus.fire('keyboard.' + event, { node: this._node, listeners: this._listeners });
};

Keyboard.prototype._init = function() {

  var listeners = this._listeners,
      commandStack = this._commandStack,
      modeling = this._modeling,
      selection = this._selection;


  // init default listeners

  function isCmd(modifiers) {
    return modifiers.ctrlKey || modifiers.metaKey;
  }

  function isShift(modifiers) {
    return modifiers.shiftKey;
  }

  // undo
  // (CTRL|CMD) + Z
  function undo(key, modifiers) {

    if (isCmd(modifiers) && !isShift(modifiers) && key === 90) {
      commandStack.undo();

      return true;
    }
  }

  // redo
  // CTRL + Y
  // CMD + SHIFT + Z
  function redo(key, modifiers) {

    if (isCmd(modifiers) && (key === 89 || (key === 90 && isShift(modifiers)))) {
      commandStack.redo();

      return true;
    }
  }


  // delete selected element
  // DEL
  function remove(key, modifiers) {

    if (key === 46) {

      var selectedElements = selection.get();

      if (selectedElements.length) {
        modeling.removeElements(selectedElements.slice());
      }

      return true;
    }
  }

  listeners.push(undo);
  listeners.push(redo);
  listeners.push(remove);
};

},{}],93:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'keyboard' ],
  keyboard: [ 'type', _dereq_(92) ]
};

},{}],94:[function(_dereq_,module,exports){
'use strict';

var Dom = _dereq_(150);

var Snap = (window.Snap);

var _ = (window._),
    getEnclosedElements = _dereq_(151).getEnclosedElements;


function LassoTool(eventBus, canvas, dragging, elementRegistry, selection) {

  this._selection = selection;
  this._dragging = dragging;

  var self = this;

  // lasso visuals implementation

  /**
  * A helper that realizes the selection box visual
  */
  var visuals = {

    create: function(context) {
      var container = canvas.getDefaultLayer(),
          frame;

      frame = context.frame = Snap.create('rect', {
        class: 'djs-lasso-overlay',
        width:  1,
        height: 1,
        x: 0,
        y: 0
      });

      frame.appendTo(container);
    },

    update: function(context) {
      var frame = context.frame,
          bbox  = context.bbox;

      frame.attr({
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height
      });
    },

    remove: function(context) {

      if (context.frame) {
        context.frame.remove();
      }
    }
  };


  // lasso interaction implementation

  eventBus.on('lasso.end', function(event) {

    var bbox = toBBox(event);

    var elements = elementRegistry.filter(function(element) {
      return element;
    });

    self.select(elements, bbox);
  });

  eventBus.on('lasso.start', function(event) {

    var context = event.context;

    context.bbox = toBBox(event);
    visuals.create(context);
  });

  eventBus.on('lasso.move', function(event) {

    var context = event.context;

    context.bbox = toBBox(event);
    visuals.update(context);
  });

  eventBus.on('lasso.end', function(event) {

    var context = event.context;

    visuals.remove(context);
  });

  eventBus.on('lasso.cleanup', function(event) {

    var context = event.context;

    visuals.remove(context);
  });


  // dom integration

  Dom.on(canvas._container, 'mousedown', function(event) {
    if (!event.button && event.altKey) {
      self.activate(event);
    }
  }, true);
}

LassoTool.$inject = [
  'eventBus',
  'canvas',
  'dragging',
  'elementRegistry',
  'selection'
];

module.exports = LassoTool;


LassoTool.prototype.activate = function(event) {

  this._dragging.activate(event, 'lasso', {
    autoActivate: true,
    data: {
      context: {}
    }
  });
};

LassoTool.prototype.select = function(elements, bbox) {
  var selectedElements = getEnclosedElements(elements, bbox);

  this._selection.select(_.values(selectedElements));
};


function toBBox(event) {

  var start = {

    x: event.x - event.dx,
    y: event.y - event.dy
  };

  var end = {
    x: event.x,
    y: event.y
  };

  var bbox;

  if ((start.x <= end.x && start.y < end.y) ||
      (start.x < end.x && start.y <= end.y)) {

      bbox = {
        x: start.x,
        y: start.y,
        width:  end.x - start.x,
        height: end.y - start.y
      };
  } else if ((start.x >= end.x && start.y < end.y) ||
             (start.x > end.x && start.y <= end.y)) {

    bbox = {
      x: end.x,
      y: start.y,
      width:  start.x - end.x,
      height: end.y - start.y
    };
  } else if ((start.x <= end.x && start.y > end.y) ||
             (start.x < end.x && start.y >= end.y)) {

    bbox = {
      x: start.x,
      y: end.y,
      width:  end.x - start.x,
      height: start.y - end.y
    };
  } else if ((start.x >= end.x && start.y > end.y) ||
             (start.x > end.x && start.y >= end.y)) {

    bbox = {
      x: end.x,
      y: end.y,
      width:  start.x - end.x,
      height: start.y - end.y
    };
  } else {

    bbox = {
      x: end.x,
      y: end.y,
      width:  0,
      height: 0
    };
  }
  return bbox;
}
},{}],95:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'lassoTool' ],
  lassoTool: [ 'type', _dereq_(94) ]
};

},{}],96:[function(_dereq_,module,exports){
'use strict';


var LayoutUtil = _dereq_(141);

function Layouter() {}

module.exports = Layouter;


Layouter.prototype.getConnectionWaypoints = function(connection) {
  return [
    LayoutUtil.getMidPoint(connection.source),
    LayoutUtil.getMidPoint(connection.target)
  ];
};

},{}],97:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var model = _dereq_(142);

/**
 * The basic modeling entry point.
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 */
function Modeling(eventBus, elementFactory, commandStack) {
  this._eventBus = eventBus;
  this._elementFactory = elementFactory;
  this._commandStack = commandStack;

  var self = this;

  eventBus.on('diagram.init', function() {
    // register modeling handlers
    self.registerHandlers(commandStack);
  });
}

Modeling.$inject = [ 'eventBus', 'elementFactory', 'commandStack' ];

module.exports = Modeling;


Modeling.prototype.getHandlers = function() {
  return {
    'shape.create': _dereq_(101),
    'shape.delete': _dereq_(104),
    'shape.move': _dereq_(107),
    'shapes.move': _dereq_(108),
    'shape.resize': _dereq_(111),

    'shape.append': _dereq_(98),

    'label.create': _dereq_(100),

    'connection.create': _dereq_(99),
    'connection.delete': _dereq_(102),
    'connection.move': _dereq_(106),
    'connection.layout': _dereq_(105),

    'connection.updateWaypoints': _dereq_(112),

    'connection.reconnectStart': _dereq_(110),
    'connection.reconnectEnd': _dereq_(110),

    'elements.delete': _dereq_(103)
  };
};

/**
 * Register handlers with the command stack
 *
 * @param {CommandStack} commandStack
 */
Modeling.prototype.registerHandlers = function(commandStack) {
  _.forEach(this.getHandlers(), function(handler, id) {
    commandStack.registerHandler(id, handler);
  });
};


///// modeling helpers /////////////////////////////////////////


Modeling.prototype.moveShape = function(shape, delta, newParent, hints) {

  var context = {
    shape: shape,
    delta:  delta,
    newParent: newParent,
    hints: hints || {}
  };

  this._commandStack.execute('shape.move', context);
};


Modeling.prototype.moveShapes = function(shapes, delta, newParent, hints) {

  var context = {
    shapes: shapes,
    delta: delta,
    newParent: newParent,
    hints: hints || {}
  };

  this._commandStack.execute('shapes.move', context);
};


Modeling.prototype.moveConnection = function(connection, delta, newParent) {

  var context = {
    connection: connection,
    delta: delta,
    newParent: newParent
  };

  this._commandStack.execute('connection.move', context);
};


Modeling.prototype.layoutConnection = function(connection) {

  var context = {
    connection: connection
  };

  this._commandStack.execute('connection.layout', context);
};


Modeling.prototype.createConnection = function(source, target, connection, parent) {

  connection = this._create('connection', connection);

  var context = {
    source: source,
    target: target,
    parent: parent,
    connection: connection
  };

  this._commandStack.execute('connection.create', context);

  return context.connection;
};


Modeling.prototype.createShape = function(shape, position, parent) {

  shape = this._create('shape', shape);

  var context = {
    position: position,
    parent: parent,
    shape: shape
  };

  this._commandStack.execute('shape.create', context);

  return context.shape;
};


Modeling.prototype.createLabel = function(labelTarget, position, label, parent) {

  label = this._create('label', label);

  var context = {
    labelTarget: labelTarget,
    position: position,
    parent: parent,
    shape: label
  };

  this._commandStack.execute('label.create', context);

  return context.shape;
};


Modeling.prototype.appendShape = function(source, shape, position, parent, connection, connectionParent) {

  shape = this._create('shape', shape);

  var context = {
    source: source,
    position: position,
    parent: parent,
    shape: shape,
    connection: connection,
    connectionParent: connectionParent
  };

  this._commandStack.execute('shape.append', context);

  return context.shape;
};


Modeling.prototype.removeElements = function(elements) {
  var context = {
    elements: elements
  };

  this._commandStack.execute('elements.delete', context);
};


Modeling.prototype.removeShape = function(shape) {
  var context = {
    shape: shape
  };

  this._commandStack.execute('shape.delete', context);
};


Modeling.prototype.removeConnection = function(connection) {
  var context = {
    connection: connection
  };

  this._commandStack.execute('connection.delete', context);
};

Modeling.prototype.resizeShape = function(shape, newBounds) {
  var context = {
    shape: shape,
    newBounds: newBounds
  };

  this._commandStack.execute('shape.resize', context);
};

Modeling.prototype.updateWaypoints = function(connection, newWaypoints) {
  var context = {
    connection: connection,
    newWaypoints: newWaypoints
  };

  this._commandStack.execute('connection.updateWaypoints', context);
};

Modeling.prototype.reconnectStart = function(connection, newSource, dockingPoint) {
  var context = {
    connection: connection,
    newSource: newSource,
    dockingPoint: dockingPoint
  };

  this._commandStack.execute('connection.reconnectStart', context);
};

Modeling.prototype.reconnectEnd = function(connection, newTarget, dockingPoint) {
  var context = {
    connection: connection,
    newTarget: newTarget,
    dockingPoint: dockingPoint
  };

  this._commandStack.execute('connection.reconnectEnd', context);
};

Modeling.prototype.connect = function(source, target, attrs) {
  return this.createConnection(source, target, attrs || {}, source.parent);
};


Modeling.prototype._create = function(type, attrs) {
  if (attrs instanceof model.Base) {
    return attrs;
  } else {
    return this._elementFactory.create(type, attrs);
  }
};
},{}],98:[function(_dereq_,module,exports){
'use strict';

var NoopHandler = _dereq_(109);


/**
 * A handler that implements reversible appending of shapes
 * to a source shape.
 *
 * @param {canvas} Canvas
 * @param {elementFactory} ElementFactory
 * @param {modeling} Modeling
 */
function AppendShapeHandler(modeling) {
  this._modeling = modeling;
}

AppendShapeHandler.prototype = Object.create(NoopHandler.prototype);

AppendShapeHandler.$inject = [ 'modeling' ];

module.exports = AppendShapeHandler;


////// api /////////////////////////////////////////////

/**
 * Creates a new shape
 *
 * @param {Object} context
 * @param {ElementDescriptor} context.shape the new shape
 * @param {ElementDescriptor} context.source the source object
 * @param {ElementDescriptor} context.parent the parent object
 * @param {Point} context.position position of the new element
 */
AppendShapeHandler.prototype.preExecute = function(context) {

  if (!context.source) {
    throw new Error('source required');
  }

  var parent = context.parent || context.source.parent,
      shape = this._modeling.createShape(context.shape, context.position, parent);

  context.shape = shape;
};

AppendShapeHandler.prototype.postExecute = function(context) {
  var parent = context.connectionParent || context.shape.parent;

  // create connection
  this._modeling.createConnection(context.source, context.shape, context.connection, parent);
};
},{}],99:[function(_dereq_,module,exports){
'use strict';


function CreateConnectionHandler(canvas, layouter) {
  this._canvas = canvas;
  this._layouter = layouter;
}

CreateConnectionHandler.$inject = [ 'canvas', 'layouter' ];

module.exports = CreateConnectionHandler;



////// api /////////////////////////////////////////

/**
 * Appends a shape to a target shape
 *
 * @param {Object} context
 * @param {djs.element.Base} context.source the source object
 * @param {djs.element.Base} context.target the parent object
 * @param {Point} context.position position of the new element
 */
CreateConnectionHandler.prototype.execute = function(context) {

  var source = context.source,
      target = context.target,
      parent = context.parent;

  if (!source || !target) {
    throw new Error('source and target required');
  }

  if (!parent) {
    throw new Error('parent required');
  }

  var connection = context.connection;

  connection.source = source;
  connection.target = target;

  if (!connection.waypoints) {
    connection.waypoints = this._layouter.getConnectionWaypoints(connection);
  }

  // add connection
  this._canvas.addConnection(connection, parent);

  return connection;
};

CreateConnectionHandler.prototype.revert = function(context) {
  var connection = context.connection;

  this._canvas.removeConnection(connection);

  connection.source = null;
  connection.target = null;
};
},{}],100:[function(_dereq_,module,exports){
'use strict';

var CreateShapeHandler = _dereq_(101);


/**
 * A handler that attaches a label to a given target shape.
 *
 * @param {canvas} Canvas
 * @param {elementFactory} ElementFactory
 */
function CreateLabelHandler(canvas) {
  this._canvas = canvas;
}

CreateLabelHandler.prototype = Object.create(CreateShapeHandler.prototype);

CreateLabelHandler.$inject = [ 'canvas' ];

module.exports = CreateLabelHandler;



////// api /////////////////////////////////////////


/**
 * Appends a label to a target shape.
 *
 * @method CreateLabelHandler#execute
 *
 * @param {Object} context
 * @param {ElementDescriptor} context.target the element the label is attached to
 * @param {ElementDescriptor} context.parent the parent object
 * @param {Point} context.position position of the new element
 */

/**
 * Undo append by removing the shape
 */
CreateLabelHandler.prototype.revert = function(context) {
  context.shape.labelTarget = null;
  this._canvas.removeShape(context.shape);
};


////// helpers /////////////////////////////////////////

CreateLabelHandler.prototype.getParent = function(context) {
  return context.parent || context.labelTarget && context.labelTarget.parent;
};

CreateLabelHandler.prototype.addElement = function(shape, parent, context) {
  shape.labelTarget = context.labelTarget;
  this._canvas.addShape(shape, parent, true);
};
},{}],101:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * A handler that implements reversible addition of shapes.
 *
 * @param {canvas} Canvas
 */
function CreateShapeHandler(canvas) {
  this._canvas = canvas;
}

CreateShapeHandler.$inject = [ 'canvas' ];

module.exports = CreateShapeHandler;



////// api /////////////////////////////////////////


/**
 * Appends a shape to a target shape
 *
 * @param {Object} context
 * @param {djs.model.Base} context.parent the parent object
 * @param {Point} context.position position of the new element
 */
CreateShapeHandler.prototype.execute = function(context) {

  var parent = this.getParent(context);

  var shape = context.shape;

  this.setPosition(shape, context);

  this.addElement(shape, parent, context);

  return shape;
};


/**
 * Undo append by removing the shape
 */
CreateShapeHandler.prototype.revert = function(context) {
  this._canvas.removeShape(context.shape);
};


////// helpers /////////////////////////////////////////

CreateShapeHandler.prototype.getParent = function(context) {
  var parent = context.parent;

  if (!parent) {
    throw new Error('parent required');
  }

  return parent;
};

CreateShapeHandler.prototype.getPosition = function(context) {
  if (!context.position) {
    throw new Error('no position given');
  }

  return context.position;
};

CreateShapeHandler.prototype.addElement = function(shape, parent) {
  this._canvas.addShape(shape, parent);
};

CreateShapeHandler.prototype.setPosition = function(shape, context) {
  var position = this.getPosition(context);

  // update to center position
  // specified in create context
  _.extend(shape, {
    x: position.x - shape.width / 2,
    y: position.y - shape.height / 2
  });
};
},{}],102:[function(_dereq_,module,exports){
'use strict';

var Collections = _dereq_(148);


/**
 * A handler that implements reversible deletion of Connections.
 *
 */
function DeleteConnectionHandler(canvas, modeling) {
  this._canvas = canvas;
  this._modeling = modeling;
}

DeleteConnectionHandler.$inject = [ 'canvas', 'modeling' ];

module.exports = DeleteConnectionHandler;


/**
 * - Remove attached label
 */
DeleteConnectionHandler.prototype.preExecute = function(context) {

  var connection = context.connection;

  // Remove label
  if (connection.label) {
    this._modeling.removeShape(connection.label);
  }
};

DeleteConnectionHandler.prototype.execute = function(context) {

  var connection = context.connection,
      parent = connection.parent;

  context.parent = parent;
  context.parentIndex = Collections.indexOf(parent.children, connection);

  context.source = connection.source;
  context.target = connection.target;

  this._canvas.removeConnection(connection);

  connection.source = null;
  connection.target = null;
  connection.label  = null;
};

/**
 * Command revert implementation.
 */
DeleteConnectionHandler.prototype.revert = function(context) {

  var connection = context.connection,
      parent = context.parent,
      parentIndex = context.parentIndex;

  connection.source = context.source;
  connection.target = context.target;

  // restore previous location in old parent
  Collections.add(parent.children, connection, parentIndex);

  this._canvas.addConnection(connection, parent);
};

},{}],103:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var NoopHandler = _dereq_(109);


function DeleteElementsHandler(modeling, elementRegistry) {
  this._modeling = modeling;
  this._elementRegistry = elementRegistry;
}

DeleteElementsHandler.$inject = [ 'modeling', 'elementRegistry' ];

DeleteElementsHandler.prototype = Object.create(NoopHandler.prototype);

module.exports = DeleteElementsHandler;


DeleteElementsHandler.prototype.postExecute = function(context) {

  var modeling = this._modeling,
      elementRegistry = this._elementRegistry,
      elements = context.elements;

  _.forEach(elements, function(element) {

    // element may have been removed with previous
    // remove operations already (e.g. in case of nesting)
    if (!elementRegistry.get(element.id)) {
      return;
    }

    if (element.waypoints) {
      modeling.removeConnection(element);
    } else {
      modeling.removeShape(element);
    }
  });
};
},{}],104:[function(_dereq_,module,exports){
'use strict';

var Collections = _dereq_(148);


/**
 * A handler that implements reversible deletion of shapes.
 *
 */
function DeleteShapeHandler(canvas, modeling) {
  this._canvas = canvas;
  this._modeling = modeling;
}

DeleteShapeHandler.$inject = [ 'canvas', 'modeling' ];

module.exports = DeleteShapeHandler;


/**
 * - Remove connections
 * - Remove all direct children
 */
DeleteShapeHandler.prototype.preExecute = function(context) {

  var shape    = context.shape,
      label    = shape.label,
      modeling = this._modeling;

  // Clean up on removeShape(label)
  if (shape.labelTarget) {
    context.labelTarget = shape.labelTarget;
    shape.labelTarget = null;
  }

  // Remove label
  if (label) {
    this._modeling.removeShape(label);
  }

  // remove connections
  this._saveClear(shape.incoming, function(connection) {
    // To make sure that the connection isn't removed twice
    // For example if a container is removed
    modeling.removeConnection(connection);
  });

  this._saveClear(shape.outgoing, function(connection) {
    modeling.removeConnection(connection);
  });


  // remove children
  this._saveClear(shape.children, function(e) {
    modeling.removeShape(e);
  });
};


DeleteShapeHandler.prototype._saveClear = function(collection, remove) {

  var e;

  while (!!(e = collection[0])) {
    remove(e);
  }
};


/**
 * Remove shape and remember the parent
 */
DeleteShapeHandler.prototype.execute = function(context) {

  var shape = context.shape,
      parent = shape.parent;

  context.parent = parent;
  context.parentIndex = Collections.indexOf(parent.children, shape);

  shape.label = null;

  this._canvas.removeShape(shape);
};


/**
 * Command revert implementation
 */
DeleteShapeHandler.prototype.revert = function(context) {

  var shape = context.shape,
      parent = context.parent,
      parentIndex = context.parentIndex,
      labelTarget = context.labelTarget;

  // restore previous location in old parent
  Collections.add(parent.children, shape, parentIndex);

  if (labelTarget) {
    labelTarget.label = shape;
  }

  this._canvas.addShape(shape, parent);
};

},{}],105:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * A handler that implements reversible moving of shapes.
 */
function LayoutConnectionHandler(layouter) {
  this._layouter = layouter;
}

LayoutConnectionHandler.$inject = [ 'layouter' ];

module.exports = LayoutConnectionHandler;


LayoutConnectionHandler.prototype.execute = function(context) {

  var connection = context.connection;

  _.extend(context, {
    oldWaypoints: connection.waypoints
  });

  connection.waypoints = this._layouter.getConnectionWaypoints(connection);

  return connection;
};

LayoutConnectionHandler.prototype.revert = function(context) {
  var connection = context.connection;
  connection.waypoints = context.oldWaypoints;

  return connection;
};
},{}],106:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Collections = _dereq_(148);

/**
 * A handler that implements reversible moving of connections.
 *
 * The handler differs from the layout connection handler in a sense
 * that it preserves the connection layout.
 */
function MoveConnectionHandler() { }

module.exports = MoveConnectionHandler;


MoveConnectionHandler.prototype.execute = function(context) {

  var connection  = context.connection,
      delta       = context.delta;


  var newParent = this.getNewParent(connection, context),
      oldParent = connection.parent;

  // save old position + parent in context
  context.oldParent = oldParent;
  context.oldParentIndex = Collections.indexOf(oldParent.children, connection);

  // update waypoint positions
  _.forEach(connection.waypoints, function(p) {
    p.x += delta.x;
    p.y += delta.y;

    if (p.original) {
      p.original.x += delta.x;
      p.original.y += delta.y;
    }
  });

  // update parent
  connection.parent = newParent;

  return connection;
};

MoveConnectionHandler.prototype.revert = function(context) {

  var connection = context.connection,
      oldParent   = context.oldParent,
      oldParentIndex = context.oldParentIndex,
      delta       = context.delta;


  // restore previous location in old parent
  Collections.add(oldParent.children, connection, oldParentIndex);

  // restore parent
  connection.parent = oldParent;

  // revert to old waypoint positions
  _.forEach(connection.waypoints, function(p) {
    p.x -= delta.x;
    p.y -= delta.y;

    if (p.original) {
      p.original.x -= delta.x;
      p.original.y -= delta.y;
    }
  });

  return connection;
};


MoveConnectionHandler.prototype.getNewParent = function(connection, context) {
  return context.newParent || connection.parent;
};

},{}],107:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var MoveHelper = _dereq_(113),
    Collections = _dereq_(148);


/**
 * A handler that implements reversible moving of shapes.
 */
function MoveShapeHandler(modeling) {
  this._modeling = modeling;

  this._helper = new MoveHelper(modeling);
}

MoveShapeHandler.$inject = [ 'modeling' ];

module.exports = MoveShapeHandler;


MoveShapeHandler.prototype.execute = function(context) {

  var shape = context.shape,
      delta = context.delta,
      newParent = this.getNewParent(context),
      oldParent = shape.parent;

  // save old parent in context
  context.oldParent = oldParent;
  context.oldParentIndex = Collections.indexOf(oldParent.children, shape);

  // update shape parent + position
  _.extend(shape, {
    parent: newParent,
    x: shape.x + delta.x,
    y: shape.y + delta.y
  });

  return shape;
};

MoveShapeHandler.prototype.postExecute = function(context) {

  var shape = context.shape;

  var modeling = this._modeling;

  if (context.hints.layout !== false) {
    _.forEach(shape.incoming, function(c) {
      modeling.layoutConnection(c);
    });

    _.forEach(shape.outgoing, function(c) {
      modeling.layoutConnection(c);
    });
  }

  if (context.hints.recurse !== false) {
    this.moveChildren(context);
  }
};

MoveShapeHandler.prototype.revert = function(context) {

  var shape = context.shape,
      oldParent = context.oldParent,
      oldParentIndex = context.oldParentIndex,
      delta = context.delta;

  // restore previous location in old parent
  Collections.add(oldParent.children, shape, oldParentIndex);

  // revert to old position and parent
  _.extend(shape, {
    parent: oldParent,
    x: shape.x - delta.x,
    y: shape.y - delta.y
  });

  return shape;
};

MoveShapeHandler.prototype.moveChildren = function(context) {

  var delta = context.delta,
      shape = context.shape;

  this._helper.moveRecursive(shape.children, delta, null);
};

MoveShapeHandler.prototype.getNewParent = function(context) {
  return context.newParent || context.shape.parent;
};
},{}],108:[function(_dereq_,module,exports){
'use strict';

var MoveHelper = _dereq_(113);


/**
 * A handler that implements reversible moving of shapes.
 */
function MoveShapesHandler(modeling) {
  this._helper = new MoveHelper(modeling);
}

MoveShapesHandler.$inject = [ 'modeling' ];

module.exports = MoveShapesHandler;

MoveShapesHandler.prototype.preExecute = function(context) {
  context.closure = this._helper.getClosure(context.shapes);
};

MoveShapesHandler.prototype.postExecute = function(context) {
  this._helper.moveClosure(context.closure, context.delta, context.newParent);
};


MoveShapesHandler.prototype.execute = function(context) { };
MoveShapesHandler.prototype.revert = function(context) { };

},{}],109:[function(_dereq_,module,exports){
'use strict';

function NoopHandler() {}

module.exports = NoopHandler;

NoopHandler.prototype.execute = function() {};
NoopHandler.prototype.revert = function() {};
},{}],110:[function(_dereq_,module,exports){


function ReconnectConnectionHandler(layouter) { }

ReconnectConnectionHandler.$inject = [ 'layouter' ];

module.exports = ReconnectConnectionHandler;

ReconnectConnectionHandler.prototype.execute = function(context) {

  var newSource = context.newSource,
      newTarget = context.newTarget,
      connection = context.connection;

  if (!newSource && !newTarget) {
    throw new Error('newSource or newTarget are required');
  }

  if (newSource && newTarget) {
    throw new Error('must specify either newSource or newTarget');
  }

  if (newSource) {
    context.oldSource = connection.source;
    connection.source = newSource;

    context.oldDockingPoint = connection.waypoints[0];
    connection.waypoints[0] = context.dockingPoint;
  }

  if (newTarget) {
    context.oldTarget = connection.target;
    connection.target = newTarget;

    context.oldDockingPoint = connection.waypoints[connection.waypoints.length - 1];
    connection.waypoints[connection.waypoints.length - 1] = context.dockingPoint;
  }

  return connection;
};

ReconnectConnectionHandler.prototype.revert = function(context) {

  var newSource = context.newSource,
      newTarget = context.newTarget,
      connection = context.connection;

  if (newSource) {
    connection.source = context.oldSource;
    connection.waypoints[0] = context.oldDockingPoint;
  }

  if (newTarget) {
    connection.target = context.oldTarget;
    connection.waypoints[connection.waypoints.length - 1] = context.oldDockingPoint;
  }

  return connection;
};
},{}],111:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * A handler that implements reversible resizing of shapes.
 *
 */
function ResizeShapeHandler(modeling) {
  this._modeling = modeling;
}

ResizeShapeHandler.$inject = [ 'modeling' ];

module.exports = ResizeShapeHandler;

/**
 * {
 *   shape: {....}
 *   newBounds: {
 *     width:  20,
 *     height: 40,
 *     x:       5,
 *     y:      10
 *   }
 *
 * }
 */
ResizeShapeHandler.prototype.execute = function(context) {

  var shape   = context.shape,
      newBounds = context.newBounds;

  // save old bbox in context
  context.oldBounds = {
    width:  shape.width,
    height: shape.height,
    x:      shape.x,
    y:      shape.y
  };

  // update shape
  _.extend(shape, {
    width:  newBounds.width,
    height: newBounds.height,
    x:      newBounds.x,
    y:      newBounds.y
  });

  return shape;
};

ResizeShapeHandler.prototype.postExecute = function(context) {

  var shape = context.shape;

  var modeling = this._modeling;

  _.forEach(shape.incoming, function(c) {
    modeling.layoutConnection(c);
  });

  _.forEach(shape.outgoing, function(c) {
    modeling.layoutConnection(c);
  });

};

ResizeShapeHandler.prototype.revert = function(context) {

  var shape   = context.shape,
      oldBounds = context.oldBounds;

  // restore previous bbox
  _.extend(shape, {
    width:  oldBounds.width,
    height: oldBounds.height,
    x:      oldBounds.x,
    y:      oldBounds.y
  });

  return shape;
};

},{}],112:[function(_dereq_,module,exports){
function UpdateWaypointsHandler() { }

module.exports = UpdateWaypointsHandler;

UpdateWaypointsHandler.prototype.execute = function(context) {

  var connection = context.connection,
      newWaypoints = context.newWaypoints;

  context.oldWaypoints = connection.waypoints;

  connection.waypoints = newWaypoints;

  return connection;
};

UpdateWaypointsHandler.prototype.revert = function(context) {

  var connection = context.connection,
      oldWaypoints = context.oldWaypoints;

  connection.waypoints = oldWaypoints;

  return connection;
};
},{}],113:[function(_dereq_,module,exports){
var _ = (window._);

var Elements = _dereq_(151);

/**
 * A helper that is able to carry out serialized move operations on multiple elements.
 *
 * @param {Modeling} modeling
 */
function MoveHelper(modeling) {
  this._modeling = modeling;
}

module.exports = MoveHelper;

/**
 * Move the specified elements and all children by the given delta.
 *
 * This moves all enclosed connections, too and layouts all affected
 * external connections.
 *
 * @param  {Array<djs.model.Base>} elements
 * @param  {Point} delta
 * @param  {djs.model.Base} newParent applied to the first level of shapes
 *
 * @return {Array<djs.model.Base>} list of touched elements
 */
MoveHelper.prototype.moveRecursive = function(elements, delta, newParent) {
  return this.moveClosure(this.getClosure(elements), delta, newParent);
};

/**
 * Move the given closure of elmements
 */
MoveHelper.prototype.moveClosure = function(closure, delta, newParent) {

  var modeling = this._modeling;

  var allShapes = closure.allShapes,
      allConnections = closure.allConnections,
      enclosedConnections = closure.enclosedConnections,
      topLevel = closure.topLevel;

  // move all shapes
  _.forEach(allShapes, function(s) {

    modeling.moveShape(s, delta, topLevel[s.id] && newParent, {
      recurse: false,
      layout: false
    });
  });

  // move all child connections / layout external connections
  _.forEach(allConnections, function(c) {

    if (enclosedConnections[c.id]) {
      modeling.moveConnection(c, delta, topLevel[c.id] && newParent);
    } else {

      // TODO: update anchor for incoming / outgoing connections
      modeling.layoutConnection(c);
    }
  });
};

/**
 * Returns the closure for the selected elements
 *
 * @param  {Array<djs.model.Base>} elements
 * @return {Object} closure
 */
MoveHelper.prototype.getClosure = function(elements) {
  return Elements.getClosure(elements);
};
},{}],114:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(63),
    _dereq_(81),
    _dereq_(129)
  ],
  __init__: [ 'modeling' ],
  modeling: [ 'type', _dereq_(97) ],
  layouter: [ 'type', _dereq_(96) ]
};

},{}],115:[function(_dereq_,module,exports){
var _ = (window._);


var LOW_PRIORITY = 500,
    HIGH_PRIORITY = 1500;

/**
 * Return a filtered list of elements that do not contain
 * those nested into others.
 *
 * @param  {Array<djs.model.Base>} elements
 *
 * @return {Array<djs.model.Base>} filtered
 */
function removeNested(elements) {

  var ids = _.groupBy(elements, 'id');

  return _.filter(elements, function(element) {
    while (!!(element = element.parent)) {
      if (ids[element.id]) {
        return false;
      }
    }

    return true;
  });
}



/**
 * A plugin that makes shapes draggable / droppable.
 *
 * @param {EventBus} eventBus
 * @param {Dragging} dragging
 * @param {Modeling} modeling
 * @param {Selection} selection
 * @param {Rules} rules
 */
function MoveEvents(eventBus, dragging, modeling, selection, rules) {

  // rules

  function canMove(shapes, delta, target) {

    return rules.allowed('shapes.move', {
      shapes: shapes,
      delta: delta,
      newParent: target
    });
  }


  // move events

  // assign a high priority to this handler to setup the environment
  // others may hook up later, e.g. at default priority and modify
  // the move environment
  //
  eventBus.on('shape.move.start', HIGH_PRIORITY, function(event) {

    var context = event.context,
        shape = event.shape,
        shapes = selection.get().slice();

    // move only single shape shape if the dragged element
    // is not part of the current selection
    if (shapes.indexOf(shape) === -1) {
      shapes = [ shape ];
    }

    // ensure we remove nested elements in the collection
    shapes = removeNested(shapes);

    // attach shapes to drag context
    _.extend(context, {
      shapes: shapes,
      shape: shape
    });

    // check if we can move the elements
    if (!canMove(shapes)) {
      // suppress move operation
      event.stopPropagation();

      return false;
    }
  });

  // assign a low priority to this handler
  // to let others modify the move event before we update
  // the context
  //
  eventBus.on('shape.move.move', LOW_PRIORITY, function(event) {

    var context = event.context,
        shapes = context.shapes,
        hover = event.hover,
        delta = { x: event.dx, y: event.dy },
        canExecute;

    // check if we can move the elements
    canExecute = canMove(shapes, delta, hover);

    context.delta = delta;
    context.canExecute = canExecute;

    // simply ignore move over
    if (canExecute === null) {
      context.target = null;

      return;
    }

    context.target = hover;
  });

  eventBus.on('shape.move.end', function(event) {

    var context = event.context;

    if (context.canExecute) {
      modeling.moveShapes(context.shapes, context.delta, context.target);
    }
  });


  // move activation

  eventBus.on('element.mousedown', function(event) {
    start(event.originalEvent, event.element);
  });


  function start(event, element, activate) {

    // do not move connections or the root element
    if (element.waypoints || !element.parent) {
      return;
    }

    dragging.activate(event, 'shape.move', {
      cursor: 'grabbing',
      autoActivate: activate,
      data: {
        shape: element,
        context: {}
      }
    });
  }

  // API

  this.start = start;
}

MoveEvents.$inject = [ 'eventBus', 'dragging', 'modeling', 'selection', 'rules' ];

module.exports = MoveEvents;

},{}],116:[function(_dereq_,module,exports){
var _ = (window._);

var Elements = _dereq_(151);

var LOW_PRIORITY = 500;

var MARKER_DRAGGING = 'djs-dragging',
    MARKER_OK = 'drop-ok',
    MARKER_NOT_OK = 'drop-not-ok';


/**
 * A plugin that makes shapes draggable / droppable.
 *
 * @param {EventBus} eventBus
 * @param {ElementRegistry} elementRegistry
 * @param {Canvas} canvas
 * @param {Styles} styles
 */
function MoveVisuals(eventBus, elementRegistry, canvas, styles) {

  function getGfx(e) {
    return elementRegistry.getGraphics(e);
  }

  function getVisualDragShapes(shapes) {
    return Elements.selfAndDirectChildren(shapes, true);
  }

  function getAllDraggedElements(shapes) {
    var allShapes = Elements.selfAndAllChildren(shapes, true);

    var allConnections = _.collect(allShapes, function(shape) {
      return (shape.incoming || []).concat(shape.outgoing || []);
    });

    return _.flatten(allShapes.concat(allConnections), true);
  }

  function addDragger(shape, dragGroup) {
    var gfx = getGfx(shape);
    var dragger = gfx.clone();
    var bbox = gfx.getBBox();

    dragger.attr(styles.cls('djs-dragger', [], {
      x: bbox.x,
      y: bbox.y
    }));

    dragGroup.add(dragger);
  }

  // assign a low priority to this handler
  // to let others modify the move context before
  // we draw things
  //
  eventBus.on('shape.move.start', LOW_PRIORITY, function(event) {

    var context = event.context,
        dragShapes = context.shapes;

    var dragGroup = canvas.getDefaultLayer().group().attr(styles.cls('djs-drag-group', [ 'no-events' ]));

    var visuallyDraggedShapes = getVisualDragShapes(dragShapes);

    visuallyDraggedShapes.forEach(function(shape) {
      addDragger(shape, dragGroup);
    });


    // cache all dragged elements / gfx
    // so that we can quickly undo their state changes later
    var allDraggedElements = context.allDraggedElements = getAllDraggedElements(dragShapes);

    // add dragging marker
    _.forEach(allDraggedElements, function(e) {
      canvas.addMarker(e, MARKER_DRAGGING);
    });

    context.dragGroup = dragGroup;
  });

  // assign a low priority to this handler
  // to let others modify the move context before
  // we draw things
  //
  eventBus.on('shape.move.move', LOW_PRIORITY, function(event) {

    var context = event.context,
        dragGroup = context.dragGroup,
        target = context.target;

    if (target) {
      canvas.addMarker(target, context.canExecute ? MARKER_OK : MARKER_NOT_OK);
    }

    dragGroup.translate(event.dx, event.dy);
  });

  eventBus.on([ 'shape.move.out', 'shape.move.cleanup' ], function(event) {
    var context = event.context;

    if (context.target) {
      canvas.removeMarker(context.target, context.canExecute ? MARKER_OK : MARKER_NOT_OK);
    }
  });

  eventBus.on('shape.move.cleanup', function(event) {

    var context = event.context,
        allDraggedElements = context.allDraggedElements,
        dragGroup = context.dragGroup;


    // remove dragging marker
    _.forEach(allDraggedElements, function(e) {
      canvas.removeMarker(e, MARKER_DRAGGING);
    });

    if (dragGroup) {
      dragGroup.remove();
    }
  });
}

MoveVisuals.$inject = [ 'eventBus', 'elementRegistry', 'canvas', 'styles' ];

module.exports = MoveVisuals;
},{}],117:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(91),
    _dereq_(133),
    _dereq_(119),
    _dereq_(129),
    _dereq_(89)
  ],
  __init__: [ 'move', 'moveVisuals' ],
  move: [ 'type', _dereq_(115) ],
  moveVisuals: [ 'type', _dereq_(116) ]
};

},{}],118:[function(_dereq_,module,exports){
'use strict';

var Snap = (window.Snap);
var getBBox = _dereq_(151).getBBox;


/**
 * @class
 *
 * A plugin that adds an outline to shapes and connections that may be activated and styled
 * via CSS classes.
 *
 * @param {EventBus} events the event bus
 */
function Outline(eventBus, styles, elementRegistry) {

  var OUTLINE_OFFSET = 6;

  var OUTLINE_STYLE = styles.cls('djs-outline', [ 'no-fill' ]);

  function createOutline(gfx, bounds) {
    return Snap.create('rect', OUTLINE_STYLE).prependTo(gfx);
  }

  function updateShapeOutline(outline, bounds) {

    outline.attr({
      x: -OUTLINE_OFFSET,
      y: -OUTLINE_OFFSET,
      width: bounds.width + OUTLINE_OFFSET * 2,
      height: bounds.height + OUTLINE_OFFSET * 2
    });
  }

  function updateConnectionOutline(outline, connection) {

    var bbox = getBBox(connection);

    outline.attr({
      x: bbox.x - OUTLINE_OFFSET,
      y: bbox.y - OUTLINE_OFFSET,
      width: bbox.width + OUTLINE_OFFSET * 2,
      height: bbox.height + OUTLINE_OFFSET * 2
    });
  }

  eventBus.on([ 'shape.added', 'shape.changed' ], function(event) {
    var element = event.element,
        gfx     = event.gfx;

    var outline = gfx.select('.djs-outline');

    if (!outline) {
      outline = createOutline(gfx, element);
    }

    updateShapeOutline(outline, element);
  });

  eventBus.on([ 'connection.added', 'connection.changed' ], function(event) {
    var element = event.element,
        gfx     = event.gfx;

    var outline = gfx.select('.djs-outline');

    if (!outline) {
      outline = createOutline(gfx, element);
    }

    updateConnectionOutline(outline, element);
  });


}


Outline.$inject = ['eventBus', 'styles', 'elementRegistry'];

module.exports = Outline;

},{}],119:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'outline' ],
  outline: [ 'type', _dereq_(118) ]
};
},{}],120:[function(_dereq_,module,exports){
'use strict';

var _ = (window._),
    $ = (window.$),
    getBBox = _dereq_(151).getBBox;

// document wide unique overlay ids
var ids = new (_dereq_(155))('ov');


/**
 * A plugin that allows users to attach overlays to diagram elements.
 *
 * The overlay service will take care of overlay positioning during updates.
 *
 * @class
 *
 * @example
 *
 * // add a pink badge on the top left of the shape
 * overlays.add(someShape, {
 *   position: {
 *     top: -5,
 *     left: -5
 *   }
 *   html: '<div style="width: 10px; background: fuchsia; color: white;">0</div>'
 * });
 *
 * // or add via shape id
 *
 * overlays.add('some-element-id', {
 *   position: {
 *     top: -5,
 *     left: -5
 *   }
 *   html: '<div style="width: 10px; background: fuchsia; color: white;">0</div>'
 * });
 *
 * // or add with optional type
 *
 * overlays.add(someShape, 'badge', {
 *   position: {
 *     top: -5,
 *     left: -5
 *   }
 *   html: '<div style="width: 10px; background: fuchsia; color: white;">0</div>'
 * });
 *
 *
 * // remove an overlay
 *
 * var id = overlays.add(...);
 * overlays.remove(id);
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {ElementRegistry} elementRegistry
 */
function Overlays(config, eventBus, canvas, elementRegistry) {

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;

  this._ids = ids;

  this._overlayDefaults = {
    show: {
      trigger: 'automatic',
      minZoom: 0.7,
      maxZoom: 5.0
    }
  };

  /**
   * Mapping overlay-id > overlay
   */
  this._overlays = {};

  /**
   * Mapping element-id > overlay container
   */
  this._overlayContainers = {};

  // root html element for all overlays
  this._overlayRoot = $('<div class="djs-overlay-container" />')
                        .css({ position: 'absolute', width: 0, height: 0 })
                        .prependTo(canvas.getContainer());

  this._init(config);
}


Overlays.$inject = [ 'config.overlays', 'eventBus', 'canvas', 'elementRegistry' ];

module.exports = Overlays;


/**
 * Returns the overlay with the specified id or a list of overlays
 * for an element with a given type.
 *
 * @example
 *
 * // return the single overlay with the given id
 * overlays.get('some-id');
 *
 * // return all overlays for the shape
 * overlays.get({ element: someShape });
 *
 * // return all overlays on shape with type 'badge'
 * overlays.get({ element: someShape, type: 'badge' });
 *
 * // shape can also be specified as id
 * overlays.get({ element: 'element-id', type: 'badge' });
 *
 *
 * @param {Object} filter
 * @param {String} [filter.id]
 * @param {String|djs.model.Base} [filter.element]
 * @param {String} [filter.type]
 *
 * @return {Object|Array<Object>} the overlay(s)
 */
Overlays.prototype.get = function(filter) {

  if (_.isString(filter)) {
    filter = { id: filter };
  }

  if (filter.element) {
    var container = this._getOverlayContainer(filter.element, true);

    // return a list of overlays when filtering by element (+type)
    if (container) {
      return filter.type ? _.filter(container.overlays, { type: filter.type }) : _.clone(container.overlays);
    } else {
      return [];
    }
  } else
  if (filter.type) {
    return _.filter(this._overlays, { type: filter.type });
  } else {
    // return single element when filtering by id
    return filter.id ? this._overlays[filter.id] : null;
  }
};

/**
 * Adds a HTML overlay to an element.
 *
 * @param {String|djs.model.Base}   element   attach overlay to this shape
 * @param {String}                  [type]    optional type to assign to the overlay
 * @param {Object}                  overlay   the overlay configuration
 *
 * @param {String|DOMElement}       overlay.html                      html element to use as an overlay
 * @param {Object}                  [overlay.show]                    show configuration
 * @param {Number}                  overlay.show.minZoom              minimal zoom level to show the overlay
 * @param {Number}                  overlay.show.maxZoom              maximum zoom level to show the overlay
 * @param {String}                  [overlay.show.trigger=automatic]  automatic or manual (user triggers show)
 * @param {Object}                  overlay.show.position             where to attach the overlay
 * @param {Number}                  [overlay.show.position.left]      relative to element bbox left attachment
 * @param {Number}                  [overlay.show.position.top]       relative to element bbox top attachment
 * @param {Number}                  [overlay.show.position.bottom]    relative to element bbox bottom attachment
 * @param {Number}                  [overlay.show.position.right]     relative to element bbox right attachment
 *
 * @return {String}                 id that may be used to reference the overlay for update or removal
 */
Overlays.prototype.add = function(element, type, overlay) {

  if (_.isObject(type)) {
    overlay = type;
    type = null;
  }

  if (!element.id) {
    element = this._elementRegistry.get(element);
  }

  if (!overlay.position) {
    throw new Error('must specifiy overlay position');
  }

  if (!overlay.html) {
    throw new Error('must specifiy overlay html');
  }

  if (!element) {
    throw new Error('invalid element specified');
  }

  var id = this._ids.next();

  overlay = _.extend({}, this._overlayDefaults, overlay, {
    id: id,
    type: type,
    element: element,
    html: $(overlay.html)
  });

  this._addOverlay(overlay);

  return id;
};


/**
 * Remove an overlay with the given id or all overlays matching the given filter.
 *
 * @see Overlays#get for filter options.
 *
 * @param {String} [id]
 * @param {Object} [filter]
 */
Overlays.prototype.remove = function(filter) {

  var overlays = this.get(filter) || [];

  if (!_.isArray(overlays)) {
    overlays = [ overlays ];
  }

  var self = this;

  _.forEach(overlays, function(overlay) {

    var container = self._getOverlayContainer(overlay.element, true);

    if (overlay) {
      overlay.html.remove();
      overlay.htmlContainer.remove();

      delete overlay.htmlContainer;
      delete overlay.element;

      delete self._overlays[overlay.id];
    }

    if (container) {
      var idx = container.overlays.indexOf(overlay);
      if (idx !== -1) {
        container.overlays.splice(idx, 1);
      }
    }
  });

};


Overlays.prototype.show = function() {
  this._overlayRoot.show();
};


Overlays.prototype.hide = function() {
  this._overlayRoot.hide();
};


Overlays.prototype._updateOverlayContainer = function(container) {
  var element = container.element,
      html = container.html;

  // update container left,top according to the elements x,y coordinates
  // this ensures we can attach child elements relative to this container

  var x = element.x,
      y = element.y;

  if (element.waypoints) {
    var bbox = getBBox(element);
    x = bbox.x;
    y = bbox.y;
  }

  html.css({ left: x, top: y });
};


Overlays.prototype._updateOverlay = function(overlay) {

  var position = overlay.position,
      htmlContainer = overlay.htmlContainer,
      element = overlay.element;

  // update overlay html relative to shape because
  // it is already positioned on the element

  // update relative
  var left = position.left,
      top = position.top;

  if (position.right !== undefined) {

    var width;

    if (element.waypoints) {
      width = getBBox(element).width;
    } else {
      width = element.width;
    }

    left = position.right * -1 + width;
  }

  if (position.bottom !== undefined) {

    var height;

    if (element.waypoints) {
      height = getBBox(element).height;
    } else {
      height = element.height;
    }

    top = position.bottom * -1 + height;
  }

  htmlContainer.css({ left: left || 0, top: top || 0 });
};


Overlays.prototype._createOverlayContainer = function(element) {
  var html = $('<div />')
                .addClass('djs-overlays')
                .addClass('djs-overlays-' + element.id)
                .css({ position: 'absolute' });

  html.appendTo(this._overlayRoot);

  var container = {
    html: html,
    element: element,
    overlays: []
  };

  this._updateOverlayContainer(container);

  return container;
};


Overlays.prototype._updateRoot = function(viewbox) {
  var a = viewbox.scale || 1;
  var d = viewbox.scale || 1;

  var matrix = 'matrix(' + a + ',0,0,' + d + ',' + (-1 * viewbox.x * a) + ',' + (-1 * viewbox.y * d) + ')';

  this._overlayRoot.css('transform', matrix);
};


Overlays.prototype._getOverlayContainer = function(element, raw) {
  var id = (element && element.id) || element;

  var container = this._overlayContainers[id];
  if (!container && !raw) {
    container = this._overlayContainers[id] = this._createOverlayContainer(element);
  }

  return container;
};


Overlays.prototype._addOverlay = function(overlay) {

  var id = overlay.id,
      element = overlay.element;

  var container = this._getOverlayContainer(element);

  var htmlContainer = $('<div>', {
    id: id,
    'class': 'djs-overlay'
  }).css({ position: 'absolute' }).append(overlay.html);

  if (overlay.type) {
    htmlContainer.addClass('djs-overlay-' + overlay.type);
  }

  overlay.htmlContainer = htmlContainer;

  container.overlays.push(overlay);
  container.html.append(htmlContainer);

  this._overlays[id] = overlay;

  this._updateOverlay(overlay);
};

Overlays.prototype._updateOverlayVisibilty = function(viewbox) {

  _.forEach(this._overlays, function(overlay) {
    if (overlay.show) {
      if (overlay.show.minZoom > viewbox.scale ||
          overlay.show.maxZoom < viewbox.scale) {
        overlay.htmlContainer.hide();
      } else {
        overlay.htmlContainer.show();
      }
    }
  });
};

Overlays.prototype._init = function(config) {

  var eventBus = this._eventBus;

  var self = this;


  // scroll/zoom integration

  var updateViewbox = function(viewbox) {
    self._updateRoot(viewbox);
    self._updateOverlayVisibilty(viewbox);

    self.show();
  };

  if (!config || config.deferUpdate !== false) {
    updateViewbox = _.debounce(updateViewbox, 300);
  }

  eventBus.on('canvas.viewbox.changed', function(event) {
    self.hide();
    updateViewbox(event.viewbox);
  });


  // remove integration

  eventBus.on([ 'shape.remove', 'connection.remove' ], function(e) {
    var overlays = self.get({ element: e.element });

    _.forEach(overlays, function(o) {
      self.remove(o.id);
    });
  });


  // move integration

  eventBus.on([
    'element.changed'
  ], function(e) {
    var element = e.element;

    var container = self._getOverlayContainer(element, true);

    if (container) {
      _.forEach(container.overlays, function(overlay) {
        self._updateOverlay(overlay);
      });

      self._updateOverlayContainer(container);
    }

  });


  // marker integration, simply add them on the overlays as classes, too.

  eventBus.on('element.marker.update', function(e) {
    var container = self._getOverlayContainer(e.element, true);
    if (container) {
      container.html[e.add ? 'addClass' : 'removeClass'](e.marker);
    }
  });
};

},{}],121:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'overlays' ],
  overlays: [ 'type', _dereq_(120) ]
};
},{}],122:[function(_dereq_,module,exports){
'use strict';

var _ = (window._),
    $ = (window.$);


/**
 * A palette containing modeling elements.
 */
function Palette(eventBus, canvas) {

  this._eventBus = eventBus;
  this._canvas = canvas;

  this._providers = [];
}

Palette.$inject = [ 'eventBus', 'canvas' ];

module.exports = Palette;


/**
 * Register a provider with the palette
 *
 * @param  {PaletteProvider} provider
 */
Palette.prototype.registerProvider = function(provider) {
  this._providers.push(provider);

  if (!this._container) {
    this._init();
  }

  this._update();
};


/**
 * Returns the palette entries for a given element
 *
 * @return {Array<PaletteEntryDescriptor>} list of entries
 */
Palette.prototype.getEntries = function() {

  var entries = {};

  // loop through all providers and their entries.
  // group entries by id so that overriding an entry is possible
  _.forEach(this._providers, function(provider) {
    var e = provider.getPaletteEntries();

    _.forEach(e, function(entry, id) {
      entries[id] = entry;
    });
  });

  return entries;
};


/**
 * Initialize
 */
Palette.prototype._init = function() {
  var parent = this._canvas.getContainer(),
      container = this._container = $(Palette.HTML_MARKUP).appendTo(parent),
      self = this;

  container.find('.djs-palette-toggle').click(function() {
    self.toggle();
  });

  // register event delegation
  container.on('click', function(event) {
    self.trigger('click', event);
  });

  // prevent drag propagation
  container.on('mousedown', function(event) {
    event.stopPropagation();
  });

  container.on('dragstart', function(event) {
    self.trigger('dragstart', event);
  });

  this._eventBus.fire('palette.create', {
    html: container
  });
};


Palette.prototype._update = function() {

  var entriesContainer = this._container.find('.djs-palette-entries').empty(),
      entries = this._entries = this.getEntries();

  _.forEach(entries, function(entry, id) {

    var grouping = entry.group || 'default';

    var container = entriesContainer.find('[data-group=' + grouping + ']');
    if (!container.length) {
      container = $('<div class="group"></div>').attr('data-group', grouping).appendTo(entriesContainer);
    }

    var html = entry.html || '<div class="entry" draggable="true"></div>';

    var control = $(html).attr('data-action', id).appendTo(container);

    if (entry.className) {
      control.addClass(entry.className);
    }

    if (entry.imageUrl) {
      control.append('<img src="' + entry.imageUrl + '">');
    }
  });

  // open after update
  this.open(true);
};


/**
 * Trigger an action available on the palette
 *
 * @param  {String} action
 * @param  {Event} event
 */
Palette.prototype.trigger = function(action, event, autoActivate) {

  var entries = this._entries,
      entry,
      handler,
      originalEvent,
      button = $(event.target);

  button = button.is('.entry') ? button : button.parents('.djs-palette .entry');

  if (!button.length) {
    return event.preventDefault();
  }

  entry = entries[button.attr('data-action')];
  handler = entry.action;

  originalEvent = event.originalEvent || event;

  // simple action (via callback function)
  if (_.isFunction(handler)) {
    if (action === 'click') {
      return handler(originalEvent, autoActivate);
    }
  } else {
    if (handler[action]) {
      return handler[action](originalEvent, autoActivate);
    }
  }

  // silence other actions
  event.preventDefault();
};


/**
 * Close the palette
 */
Palette.prototype.close = function() {
  this._container.removeClass('open');
};


/**
 * Open the palette
 */
Palette.prototype.open = function() {
  this._container.addClass('open');
};


Palette.prototype.toggle = function(open) {
  if (this.isOpen()) {
    this.close();
  } else {
    this.open();
  }
};


/**
 * Return true if the palette is opened.
 *
 * @example
 *
 * palette.open();
 *
 * if (palette.isOpen()) {
 *   // yes, we are open
 * }
 *
 * @return {boolean} true if palette is opened
 */
Palette.prototype.isOpen = function() {
  return this._container && this._container.hasClass('open');
};


/* markup definition */

Palette.HTML_MARKUP =
  '<div class="djs-palette">' +
    '<div class="djs-palette-entries"></div>' +
    '<div class="djs-palette-toggle"></div>' +
  '</div>';
},{}],123:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'palette' ],
  palette: [ 'type', _dereq_(122) ],
};

},{}],124:[function(_dereq_,module,exports){
'use strict';

var Snap = (window.Snap);

var _ = (window._),
    ResizeUtil = _dereq_(125),
    Dom = _dereq_(150);


var HANDLE_OFFSET = -2,
    HANDLE_SIZE  = 5,
    HANDLE_HIT_SIZE = 20;

var MARKER_RESIZING = 'djs-resizing',
    MARKER_RESIZE_NOT_OK = 'resize-not-ok',
    CLS_RESIZER   = 'djs-resizer';


/**
 * Implements resize on shapes by
 *
 *   * adding resize handles,
 *   * creating a visual during resize
 *   * checking resize rules
 *   * committing a change once finished
 *
 */
function Resize(eventBus, elementRegistry, rules, modeling, canvas, selection, dragging) {

  function canResize(context) {
    var ctx = _.pick(context, [ 'newBounds', 'shape', 'delta', 'direction' ]);
    return rules.allowed('shape.resize', ctx);
  }


  // resizing implementation //////////////////////////////////

  /**
   * A helper that realizes the resize visuals
   */
  var visuals = {
    create: function(context) {
      var container = canvas.getDefaultLayer(),
          shape = context.shape,
          frame;

      frame = context.frame = Snap.create('rect', {
        class: 'djs-resize-overlay',
        width:  shape.width + 10,
        height: shape.height + 10,
        x: shape.x -5,
        y: shape.y -5
      });

      frame.appendTo(container);
    },

    update: function(context) {
      var frame = context.frame,
          bounds = context.newBounds;

      if (bounds.width > 5) {
        frame.attr({
          x: bounds.x,
          width: bounds.width
        });
      }

      if (bounds.height > 5) {
        frame.attr({
          y: bounds.y,
          height: bounds.height
        });
      }

      frame[context.canExecute ? 'removeClass' : 'addClass'](MARKER_RESIZE_NOT_OK);
    },

    remove: function(context) {
      if (context.frame) {
        context.frame.remove();
      }
    }
  };


  eventBus.on('resize.start', function(event) {

    var context = event.context,
        shape = context.shape;

    // add resizable indicator
    canvas.addMarker(shape, MARKER_RESIZING);

    visuals.create(context);
  });

  eventBus.on('resize.move', function(event) {

    var context = event.context,
        shape = context.shape,
        direction = context.direction,
        delta;

    delta = {
      x: event.dx,
      y: event.dy
    };

    context.delta = delta;

    context.newBounds = ResizeUtil.resizeBounds(shape, direction, delta);

    // update + cache executable state
    context.canExecute = canResize(context);

    // update resize frame visuals
    visuals.update(context);
  });

  eventBus.on('resize.end', function(event) {
    var context = event.context,
        shape = context.shape;

    // perform the actual resize
    if (context.canExecute) {
      modeling.resizeShape(shape, context.newBounds);
    }
  });

  eventBus.on('resize.cleanup', function(event) {

    var context = event.context,
        shape = context.shape;

    // remove resizable indicator
    canvas.removeMarker(shape, MARKER_RESIZING);

    // remove frame + destroy context
    visuals.remove(context);
  });


  function start(event, shape, direction) {

    dragging.activate(event, 'resize', {
      autoActivate: true,
      data: {
        shape: shape,
        context: {
          direction: direction,
          shape: shape
        }
      }
    });
  }

  function makeDraggable(element, gfx, direction) {

    function listener(event) {
      // only start on left-click (button=0)
      if (!event.button) {
        start(event, element, direction);
      }
    }

    Dom.on(gfx.node, 'mousedown', listener);
    Dom.on(gfx.node, 'touchstart', listener);
  }

  function __createResizer(gfx, x, y, rotation, direction) {

    var group = gfx.group().addClass(CLS_RESIZER).addClass(CLS_RESIZER + '-' + direction);

    var origin = -HANDLE_SIZE + HANDLE_OFFSET;

    // Create four drag indicators on the outline
    group.rect(origin, origin, HANDLE_SIZE, HANDLE_SIZE).addClass(CLS_RESIZER + '-visual');
    group.rect(origin, origin, HANDLE_HIT_SIZE, HANDLE_HIT_SIZE).addClass(CLS_RESIZER + '-hit');

    var matrix = new Snap.Matrix().translate(x, y).rotate(rotation, 0, 0);
    group.transform(matrix);

    return group;
  }

  function createResizer(element, gfx, direction) {

    var resizer;

    if (direction === 'nw') {
      resizer = __createResizer(gfx, 0, 0, 0, direction);
    } else if (direction === 'ne') {
      resizer = __createResizer(gfx, element.width, 0, 90, direction);
    } else if (direction === 'se') {
      resizer = __createResizer(gfx, element.width, element.height, 180, direction);
    } else {
      resizer = __createResizer(gfx, 0, element.height, 270, direction);
    }

    makeDraggable(element, resizer, direction);
  }

  // resize handles implementation ///////////////////////////////

  function addResize(shape) {

    if (!canResize({ shape: shape })) {
      return;
    }

    var gfx = elementRegistry.getGraphics(shape);

    createResizer(shape, gfx, 'nw');
    createResizer(shape, gfx, 'ne');
    createResizer(shape, gfx, 'se');
    createResizer(shape, gfx, 'sw');
  }

  function removeResize(shape) {

    var gfx = elementRegistry.getGraphics(shape);
    var resizers = gfx.selectAll('.' + CLS_RESIZER);

    _.forEach(resizers, function(resizer){
      resizer.remove();
    });
  }

  eventBus.on('selection.changed', function(e) {

    var oldSelection = e.oldSelection,
        newSelection = e.newSelection;

    // remove old selection markers
    _.forEach(oldSelection, removeResize);

    // add new selection markers ONLY if single selection
    if (newSelection.length === 1) {
      _.forEach(newSelection, addResize);
    }
  });

  eventBus.on('shape.changed', function(e) {
    var shape = e.element;

    removeResize(shape);

    if (selection.isSelected(shape)) {
      addResize(shape);
    }
  });


  // API

  this.start = start;
}

Resize.$inject = [ 'eventBus', 'elementRegistry', 'rules', 'modeling', 'canvas', 'selection', 'dragging' ];

module.exports = Resize;

},{}],125:[function(_dereq_,module,exports){
/**
 * Resize the given bounds by the specified delta from a given anchor point.
 *
 * @param {Bounds} bounds the bounding box that should be resized
 * @param {String} direction in which the element is resized (nw, ne, se, sw)
 * @param {Point} delta of the resize operation
 *
 * @return {Bounds} resized bounding box
 */
module.exports.resizeBounds = function(bounds, direction, delta) {

  var dx = delta.x,
      dy = delta.y;

  switch (direction) {

    case 'nw':
      return {
        x: bounds.x + dx,
        y: bounds.y + dy,
        width: bounds.width - dx,
        height: bounds.height - dy
      };

    case 'sw':
      return {
        x: bounds.x + dx,
        y: bounds.y,
        width: bounds.width - dx,
        height: bounds.height + dy
      };

    case 'ne':
      return {
        x: bounds.x,
        y: bounds.y + dy,
        width: bounds.width + dx,
        height: bounds.height - dy
      };

    case 'se':
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width + dx,
        height: bounds.height + dy
      };

    default:
      throw new Error('unrecognized direction: ' + direction);
  }
};

module.exports.reattachPoint = function(bounds, newBounds, point) {

  var sx = bounds.width / newBounds.width,
      sy = bounds.height / newBounds.height;

  return {
    x: Math.round((newBounds.x + newBounds.width / 2)) - Math.floor(((bounds.x + bounds.width / 2) - point.x) / sx),
    y: Math.round((newBounds.y + newBounds.height / 2)) - Math.floor(((bounds.y + bounds.height / 2) - point.y) / sy)
  };
};
},{}],126:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(114),
    _dereq_(129),
    _dereq_(89)
  ],
  __init__: [ 'resize' ],
  resize: [ 'type', _dereq_(124) ]
};

},{}],127:[function(_dereq_,module,exports){
/**
 * A basic provider that may be extended to implement modeling rules.
 *
 * Extensions should implement the init method to actually add their custom
 * modeling checks. Checks may be added via the #addRule(action, fn) method.
 *
 * @param {EventBus} eventBus
 */
function RuleProvider(eventBus) {
  this._eventBus = eventBus;

  this.init();
}

RuleProvider.$inject = [ 'eventBus' ];

module.exports = RuleProvider;


/**
 * Adds a modeling rule for the given action, implemented through a callback function.
 *
 * The function will receive the modeling specific action context to perform its check.
 * It must return false or null to disallow the action from happening.
 *
 * Returning <code>null</code> may encode simply ignoring the action.
 *
 * @example
 *
 * ResizableRules.prototype.init = function() {
 *
 *   this.addRule('shape.resize', function(context) {
 *
 *     var shape = context.shape;
 *
 *     if (!context.newBounds) {
 *       // check general resizability
 *       if (!shape.resizable) {
 *         return false;
 *       }
 *     } else {
 *       // element must have minimum size of 10*10 points
 *       return context.newBounds.width > 10 && context.newBounds.height > 10;
 *     }
 *   });
 * };
 *
 * @param {String|Array<String>} actions the identifier for the modeling action to check
 * @param {Function} fn the callback function that performs the actual check
 */
RuleProvider.prototype.addRule = function(actions, fn) {

  var eventBus = this._eventBus;

  // hook into the command stacks modeling checks via the event bus

  if (typeof actions === 'string') {
    actions = [ actions ];
  }

  actions.forEach(function(action) {

    eventBus.on('commandStack.' + action + '.canExecute', function(event) {

      var result = fn(event.context);

      if (result === false) {
        event.preventDefault();
        event.stopPropagation();
      } else if (result === null) {
        event.stopPropagation();
      }
    });
  });
};
},{}],128:[function(_dereq_,module,exports){
'use strict';

/**
 * A service that provides rules for certain diagram actions.
 *
 * @param {CommandStack} commandStack
 */
function Rules(commandStack) {
  this._commandStack = commandStack;
}

Rules.$inject = [ 'commandStack' ];

module.exports = Rules;


/**
 * This method can be queried to ask whether certain modeling actions
 * are allowed or not.
 *
 * @param  {String} action the action to be checked
 * @param  {Object} [context] the context to check the action in
 *
 * @return {Boolean} returns true, false or null depending on whether the
 *                   operation is allowed, not allowed or should be ignored.
 */
Rules.prototype.allowed = function(action, context) {
  return this._commandStack.canExecute(action, context);
};
},{}],129:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(63) ],
  __init__: [ 'rules' ],
  rules: [ 'type', _dereq_(128) ]
};

},{}],130:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);


/**
 * A service that offers the current selection in a diagram.
 * Offers the api to control the selection, too.
 *
 * @class
 *
 * @param {EventBus} eventBus the event bus
 */
function Selection(eventBus) {

  this._eventBus = eventBus;

  this._selectedElements = [];

  var self = this;

  eventBus.on([ 'shape.remove', 'connection.remove' ], function(e) {
    var element = e.element;
    self.deselect(element);
  });
}

Selection.$inject = [ 'eventBus' ];

module.exports = Selection;


Selection.prototype.deselect = function(element) {
  var selectedElements = this._selectedElements;

  var idx = selectedElements.indexOf(element);

  if (idx !== -1) {
    var oldSelection = selectedElements.slice();

    selectedElements.splice(idx, 1);

    this._eventBus.fire('selection.changed', { oldSelection: oldSelection, newSelection: selectedElements });
  }
};


Selection.prototype.get = function() {
  return this._selectedElements;
};

Selection.prototype.isSelected = function(element) {
  return this._selectedElements.indexOf(element) !== -1;
};


/**
 * This method selects one or more elements on the diagram.
 *
 * By passing an additional add parameter you can decide whether or not the element(s)
 * should be added to the already existing selection or not.
 *
 * @method Selection#select
 *
 * @param  {Object|Object[]} elements element or array of elements to be selected
 * @param  {boolean} [add] whether the element(s) should be appended to the current selection, defaults to false
 */
Selection.prototype.select = function(elements, add) {
  var selectedElements = this._selectedElements,
      oldSelection = selectedElements.slice();

  if (!_.isArray(elements)) {
    elements = elements ? [ elements ] : [];
  }

  // selection may be cleared by passing an empty array or null
  // to the method
  if (add) {
    _.forEach(elements, function(element) {
      if (selectedElements.indexOf(element) !== -1) {
        // already selected
        return;
      } else {
        selectedElements.push(element);
      }
    });
  } else {
    this._selectedElements = selectedElements = elements.slice();
  }
  this._eventBus.fire('selection.changed', { oldSelection: oldSelection, newSelection: selectedElements });
};

},{}],131:[function(_dereq_,module,exports){
'use strict';


var getOriginalEvent = _dereq_(152).getOriginal;

function SelectionBehavior(eventBus, selection, canvas) {

  eventBus.on('create.end', 500, function(e) {
    if (e.context.canExecute) {
      selection.select(e.shape);
    }
  });

  eventBus.on('connect.end', 500, function(e) {
    if (e.context.canExecute && e.context.target) {
      selection.select(e.context.target);
    }
  });

  eventBus.on('shape.move.end', 500, function(e) {
    selection.select(e.context.shapes);
  });


  // Shift + click selection
  eventBus.on('element.click', function(event) {

    var element = event.element;

    // do not select the root element
    // or connections
    if (element === canvas.getRootElement()) {
      element = null;
    }

    if (!selection.isSelected(element)) {
      var ev = (getOriginalEvent(event) || event);
      var add = ev.shiftKey;

      if (!ev.altKey) {
        selection.select(element, add);
      }
    } else {
      selection.deselect(element);
    }
  });
}

SelectionBehavior.$inject = [ 'eventBus', 'selection', 'canvas' ];

module.exports = SelectionBehavior;

},{}],132:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var MARKER_HOVER = 'hover',
    MARKER_SELECTED = 'selected';

/**
 * A plugin that adds a visible selection UI to shapes and connections
 * by appending the <code>hover</code> and <code>selected</code> classes to them.
 *
 * @class
 *
 * Makes elements selectable, too.
 *
 * @param {EventBus} events
 * @param {SelectionService} selection
 * @param {Canvas} canvas
 */
function SelectionVisuals(events, canvas, selection, graphicsFactory, styles) {

  this._multiSelectionBox = null;

  function addMarker(e, cls) {
    canvas.addMarker(e, cls);
  }

  function removeMarker(e, cls) {
    canvas.removeMarker(e, cls);
  }

  events.on('element.hover', function(event) {
    addMarker(event.element, MARKER_HOVER);
  });

  events.on('element.out', function(event) {
    removeMarker(event.element, MARKER_HOVER);
  });

  events.on('selection.changed', function(event) {

    function deselect(s) {
      removeMarker(s, MARKER_SELECTED);
    }

    function select(s) {
      addMarker(s, MARKER_SELECTED);
    }

    var oldSelection = event.oldSelection,
        newSelection = event.newSelection;

    _.forEach(oldSelection, function(e) {
      if (newSelection.indexOf(e) === -1) {
        deselect(e);
      }
    });

    _.forEach(newSelection, function(e) {
      if (oldSelection.indexOf(e) === -1) {
        select(e);
      }
    });
  });
}

SelectionVisuals.$inject = [
  'eventBus',
  'canvas',
  'selection',
  'graphicsFactory',
  'styles'
];

module.exports = SelectionVisuals;

},{}],133:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'selectionVisuals', 'selectionBehavior' ],
  __depends__: [
    _dereq_(91),
    _dereq_(119)
  ],
  selection: [ 'type', _dereq_(130) ],
  selectionVisuals: [ 'type', _dereq_(132) ],
  selectionBehavior: [ 'type', _dereq_(131) ]
};

},{}],134:[function(_dereq_,module,exports){
'use strict';

var _ = (window._),
    Snap = (window.Snap);


function toPoint(event) {
  return _.pick(event, [ 'x', 'y' ]);
}

function mid(element) {
  if (element.x === undefined || element.y === undefined) {
    return null;
  }

  return {
    x: Math.round(element.x + element.width / 2),
    y: Math.round(element.y + element.height / 2)
  };
}

function snapTo(candidates, point) {
  return Snap.snapTo(candidates, point);
}

function Snapping(eventBus, canvas) {

  this._canvas = canvas;

  var self = this;

  eventBus.on([ 'shape.move.start', 'create.start' ], function(event) {
    self.initSnap(event);
  });

  eventBus.on([ 'shape.move.move', 'shape.move.end', 'create.move', 'create.end' ], function(event) {
    self.snap(event);
  });

  eventBus.on([ 'shape.move.cleanup', 'create.cleanup' ], function(event) {
    self.hide();
  });

  // delay hide by 1000 seconds since last match
  this._asyncHide = _.debounce(this.hide, 1000);
}

Snapping.$inject = [ 'eventBus', 'canvas' ];

module.exports = Snapping;


Snapping.prototype.initSnap = function(event) {
  var context = event.context;

  context.snapStart = mid(context.shape) || toPoint(event);
  context.snapPoints = {};
};


Snapping.prototype.snap = function(event) {

  var context = event.context,
      start = context.snapStart,
      x = start.x + event.dx,
      y = start.y + event.dy;

  var sx, sy;

  var snapPoints = this.getSnapPoints(context);

  if (!snapPoints) {
    return;
  }

  // snap
  sx = snapTo(snapPoints.vertical, x);
  sy = snapTo(snapPoints.horizontal, y);

  // show snap controls
  this.showSnap('horizontal', snapPoints.horizontalMap[sy], { x: x, y: sy });
  this.showSnap('vertical', snapPoints.verticalMap[sx], { x: sx, y: y });

  // correction x/y
  var cx = (x - sx),
      cy = (y - sy);

  // update delta
  _.extend(event, {
    dx: event.dx - cx,
    dy: event.dy - cy,
    x: event.x - cx,
    y: event.y - cy
  });
};


Snapping.prototype._createLine = function(path) {
  var root = this._canvas.getLayer('snap');

  var line = root.path('M0,0 L0,0').addClass('djs-snap-line');

  line.update = function(snap) {
    if (snap) {
      line.attr({
        path: Snap.format(path, snap),
        display: ''
      });
    } else {
      line.attr({
        display: 'none'
      });
    }
  };

  return line;
};

Snapping.prototype._createSnapLines = function() {

  this._snapLines = {
    horizontal: this._createLine('M{start},{snap}L{end},{snap}'),
    vertical: this._createLine('M{snap},{start}L{snap},{end}')
  };
};

Snapping.prototype.showSnap = function(orientation, points, pos) {

  var snap, vertical, coordinates;

  // ensure the snap line has an appropriate length
  // to reach from start to end
  if (points) {
    vertical = orientation === 'vertical';
    coordinates = _.map(points.concat([ pos ]), vertical ? 'y' : 'x');
    snap = {
      snap: pos[vertical ? 'x' : 'y'],
      start: Math.min.apply(null, coordinates) - 5000,
      end: Math.max.apply(null, coordinates) + 5000,
    };
  }

  var line = this.getSnapLine(orientation);
  if (line) {
    line.update(snap);
  }

  this._asyncHide();
};

Snapping.prototype.getSnapLine = function(orientation) {
  if (!this._snapLines) {
    this._createSnapLines();
  }

  return this._snapLines[orientation];
};

Snapping.prototype.hide = function() {
  _.forEach(this._snapLines, function(l) {
    l.update();
  });
};

Snapping.prototype.getSnapPoints = function(context) {

  var element = context.shape,
      target = context.target,
      snapPoints = context.snapPoints;

  if (!target) {
    return;
  }

  var points = snapPoints[target.id];

  if (!points) {

    var snapTargets = this.getSnapTargets(element, target);

    var horizontal = [],
        vertical = [],
        horizontalMap = {},
        verticalMap = {};

    _.forEach(snapTargets, function(t) {
      var snap = mid(t);

      horizontal.push(snap.y);
      vertical.push(snap.x);

      (horizontalMap[snap.y] = horizontalMap[snap.y] || []).push(t);
      (verticalMap[snap.x] = verticalMap[snap.x] || []).push(t);
    });

    points = snapPoints[target.id] = {
      horizontal: horizontal,
      vertical: vertical,
      horizontalMap: horizontalMap,
      verticalMap: verticalMap
    };
  }

  return points;
};

Snapping.prototype.getSnapTargets = function(element, target) {

  // snap to all non connection siblings
  return target && _.filter(target.children, function(e) {
    return !e.hidden && !e.labelTarget && !e.waypoints && e !== element;
  });
};
},{}],135:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'snapping' ],
  snapping: [ 'type', _dereq_(134) ]
};
},{}],136:[function(_dereq_,module,exports){
'use strict';

function TouchFix(canvas, eventBus) {

  var self = this;

  eventBus.on('canvas.init', function(e) {
    self.addBBoxMarker(e.svg);
  });
}

TouchFix.$inject = [ 'canvas', 'eventBus' ];

module.exports = TouchFix;


/**
 * Safari mobile (iOS 7) does not fire touchstart event in <SVG> element
 * if there is no shape between 0,0 and viewport elements origin.
 *
 * So touchstart event is only fired when the <g class="viewport"> element was hit.
 * Putting an element over and below the 'viewport' fixes that behavior.
 */
TouchFix.prototype.addBBoxMarker = function(paper) {

  var markerStyle = {
    fill: 'none',
    class: 'outer-bound-marker'
  };

  paper.rect(-10000, -10000, 10, 10).attr(markerStyle);
  paper.rect(10000, 10000, 10, 10).attr(markerStyle);
};

},{}],137:[function(_dereq_,module,exports){
var Hammer = (window.Hammer),
    Snap = (window.Snap),
    Dom = _dereq_(150),
    Event = _dereq_(152);

var MIN_ZOOM = 0.2,
    MAX_ZOOM = 4;

function log() {
  if (false) {
    console.log.apply(console, arguments);
  }
}

function get(service, injector) {
  try {
    return injector.get(service);
  } catch (e) {
    return null;
  }
}

function createTouchRecognizer(node) {

  function stopEvent(event) {
    Event.stopEvent(event, true);
  }

  function stopMouse(event) {
    Dom.on(node, 'mousedown', stopEvent, true);
    Dom.on(node, 'mouseup', stopEvent, true);
    Dom.on(node, 'mouseover', stopEvent, true);
    Dom.on(node, 'mouseout', stopEvent, true);
    Dom.on(node, 'click', stopEvent, true);
    Dom.on(node, 'dblclick', stopEvent, true);
  }

  function allowMouse(event) {
    setTimeout(function() {
      Dom.off(node, 'mousedown', stopEvent, true);
      Dom.off(node, 'mouseup', stopEvent, true);
      Dom.off(node, 'mouseover', stopEvent, true);
      Dom.off(node, 'mouseout', stopEvent, true);
      Dom.off(node, 'click', stopEvent, true);
      Dom.off(node, 'dblclick', stopEvent, true);
    }, 500);
  }

  node.addEventListener('touchstart', stopMouse, true);
  node.addEventListener('touchend', allowMouse, true);
  node.addEventListener('touchcancel', allowMouse, true);

  // A touch event recognizer that handles
  // touch events only (we know, we can already handle
  // mouse events out of the box)

  var recognizer = new Hammer.Manager(node, {
    inputClass: Hammer.TouchInput,
    recognizers: []
  });


  var tap = new Hammer.Tap();
  var pan = new Hammer.Pan({ threshold: 10 });
  var press = new Hammer.Press();
  var pinch = new Hammer.Pinch();

  var doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });

  pinch.requireFailure(pan);
  pinch.requireFailure(press);

  recognizer.add([ pan, press, pinch, doubleTap, tap ]);

  recognizer.reset = function(force) {
    var recognizers = this.recognizers,
        session = this.session;

    if (session.stopped) {
      return;
    }

    log('recognizer', 'stop');

    recognizer.stop(force);

    setTimeout(function() {
      var i, r;

      log('recognizer', 'reset');
      for (i = 0; !!(r = recognizers[i]); i++) {
        r.reset();
        r.state = 8; // FAILED STATE
      }

      session.curRecognizer = null;
    }, 0);
  };

  recognizer.on('hammer.input', function(event) {
    if (event.srcEvent.defaultPrevented) {
      recognizer.reset(true);
    }
  });

  return recognizer;
}

/**
 * A plugin that provides touch events for elements.
 *
 * @param {EventBus} eventBus
 * @param {InteractionEvents} interactionEvents
 */
function TouchInteractionEvents(injector, canvas, eventBus, elementRegistry, interactionEvents) {

  // optional integrations
  var dragging = get('dragging', injector),
      move = get('move', injector),
      contextPad = get('contextPad', injector),
      palette = get('palette', injector);

  // the touch recognizer
  var recognizer;

  function handler(type) {

    return function(event) {
      log('element', type, event);

      interactionEvents.fire(type, event);
    };
  }

  function getGfx(target) {
    var node = Dom.closest(target, 'svg, .djs-element');
    return node && new Snap(node);
  }

  function initEvents(svg) {

    // touch recognizer
    recognizer = createTouchRecognizer(svg);

    recognizer.on('doubletap', handler('element.dblclick'));

    recognizer.on('tap', handler('element.click'));

    function startGrabCanvas(event) {

      log('canvas', 'grab start');

      var lx = 0, ly = 0;

      function update(e) {

        var dx = e.deltaX - lx,
            dy = e.deltaY - ly;

        canvas.scroll({ dx: dx, dy: dy });

        lx = e.deltaX;
        ly = e.deltaY;
      }

      function end(e) {
        recognizer.off('panmove', update);
        recognizer.off('panend', end);
        recognizer.off('pancancel', end);

        log('canvas', 'grab end');
      }

      recognizer.on('panmove', update);
      recognizer.on('panend', end);
      recognizer.on('pancancel', end);
    }

    function startGrab(event) {

      var gfx = getGfx(event.target),
          element = gfx && elementRegistry.get(gfx);

      // recognizer
      if (move && canvas.getRootElement() !== element) {
        log('element', 'move start', element, event, true);
        return move.start(event, element, true);
      } else {
        startGrabCanvas(event);
      }
    }

    function startZoom(e) {

      log('canvas', 'zoom start');

      var zoom = canvas.zoom(),
          mid = e.center;

      function update(e) {

        var ratio = 1 - (1 - e.scale) / 1.50,
            newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ratio * zoom));

        canvas.zoom(newZoom, mid);

        Event.stopEvent(e, true);
      }

      function end(e) {
        recognizer.off('pinchmove', update);
        recognizer.off('pinchend', end);
        recognizer.off('pinchcancel', end);

        recognizer.reset(true);

        log('canvas', 'zoom end');
      }

      recognizer.on('pinchmove', update);
      recognizer.on('pinchend', end);
      recognizer.on('pinchcancel', end);
    }

    recognizer.on('panstart', startGrab);
    recognizer.on('press', startGrab);

    recognizer.on('pinchstart', startZoom);
  }

  if (dragging) {

    // simulate hover during dragging
    eventBus.on('drag.move', function(event) {

      var position = Event.toPoint(event.originalEvent);

      var node = document.elementFromPoint(position.x, position.y),
          gfx = getGfx(node),
          element = gfx && elementRegistry.get(gfx);

      if (element !== event.hover) {
        if (event.hover) {
          dragging.out(event);
        }

        if (element) {
          dragging.hover({ element: element, gfx: gfx });

          event.hover = element;
          event.hoverGfx = gfx;
        }
      }
    });
  }

  if (contextPad) {

    eventBus.on('contextPad.create', function(event) {
      var node = event.pad.html.get(0);

      // touch recognizer
      var padRecognizer = createTouchRecognizer(node);

      padRecognizer.on('panstart', function(event) {
        log('context-pad', 'panstart', event);
        contextPad.trigger('dragstart', event, true);
      });

      padRecognizer.on('press', function(event) {
        log('context-pad', 'press', event);
        contextPad.trigger('dragstart', event, true);
      });

      padRecognizer.on('tap', function(event) {
        log('context-pad', 'tap', event);
        contextPad.trigger('click', event);
      });
    });
  }

  if (palette) {
    eventBus.on('palette.create', function(event) {
      var node = event.html.get(0);

      // touch recognizer
      var padRecognizer = createTouchRecognizer(node);

      padRecognizer.on('panstart', function(event) {
        log('palette', 'panstart', event);
        palette.trigger('dragstart', event, true);
      });

      padRecognizer.on('press', function(event) {
        log('palette', 'press', event);
        palette.trigger('dragstart', event, true);
      });

      padRecognizer.on('tap', function(event) {
        log('palette', 'tap', event);
        palette.trigger('click', event);
      });
    });
  }

  eventBus.on('canvas.init', function(event) {
    initEvents(event.svg.node);
  });
}


TouchInteractionEvents.$inject = [
  'injector',
  'canvas',
  'eventBus',
  'elementRegistry',
  'interactionEvents',
  'touchFix'
];

module.exports = TouchInteractionEvents;
},{}],138:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(91) ],
  __init__: [ 'touchInteractionEvents' ],
  touchInteractionEvents: [ 'type', _dereq_(137) ],
  touchFix: [ 'type', _dereq_(136) ]
};
},{}],139:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var LayoutUtil = _dereq_(141);

/**
 * @memberOf djs.layout
 */


function toPoint(docking) {
  return _.extend({ original: docking.point.original || docking.point }, docking.actual);
}


/**
 * A {@link ConnectionDocking} that crops connection waypoints based on
 * the path(s) of the connection source and target.
 *
 * @class
 * @constructor
 *
 * @param {djs.core.ElementRegistry} elementRegistry
 */
function CroppingConnectionDocking(elementRegistry) {
  this._elementRegistry = elementRegistry;
}

CroppingConnectionDocking.$inject = [ 'elementRegistry' ];

module.exports = CroppingConnectionDocking;


/**
 * @inheritDoc ConnectionDocking#getCroppedWaypoints
 */
CroppingConnectionDocking.prototype.getCroppedWaypoints = function(connection) {

  var sourceDocking = this.getDockingPoint(connection, connection.source),
      targetDocking = this.getDockingPoint(connection, connection.target);

  var waypoints = connection.waypoints.slice(sourceDocking.idx + 1, targetDocking.idx);

  waypoints.unshift(toPoint(sourceDocking));
  waypoints.push(toPoint(targetDocking));

  return waypoints;
};

/**
 * Return the connection docking point on the specified shape
 *
 * @inheritDoc ConnectionDocking#getDockingPoint
 */
CroppingConnectionDocking.prototype.getDockingPoint = function(connection, shape) {

  var point, idx = -1,
      dockingPoint = this._getIntersection(shape, connection);

  if (shape === connection.target) {
    idx = connection.waypoints.length - 1;
  } else if (shape === connection.source) {
    idx = 0;
  } else {
    throw new Error('connection not properly connected');
  }

  if (idx !== -1) {
    point = connection.waypoints[idx];

    return {
      point: point,
      actual: dockingPoint || point,
      idx: idx
    };
  }

  return null;
};


////// helper methods ///////////////////////////////////////////////////

CroppingConnectionDocking.prototype._getIntersection = function(shape, connection) {

  var shapePath = this._getShapePath(shape),
      connectionPath = this._getConnectionPath(connection);

  return LayoutUtil.getElementLineIntersection(shapePath, connectionPath, connection.source === shape);
};

CroppingConnectionDocking.prototype._getConnectionPath = function(connection) {
  return LayoutUtil.getConnectionPath(connection.waypoints);
};

CroppingConnectionDocking.prototype._getShapePath = function(shape) {
  return LayoutUtil.getShapePath(this._getGfx(shape), shape);
};

CroppingConnectionDocking.prototype._getGfx = function(element) {
  return this._elementRegistry.getGraphics(element);
};
},{}],140:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var LayoutUtil = _dereq_(141),
    Geometry = _dereq_(153);

var MIN_DISTANCE = 20;


/**
 * Returns the mid points for a manhattan connection between two points.
 *
 * @example
 *
 * [a]----[x]
 *         |
 *        [x]--->[b]
 *
 * @param  {Point} a
 * @param  {Point} b
 * @param  {String} directions
 *
 * @return {Array<Point>}
 */
module.exports.getMidPoints = function(a, b, directions) {

  directions = directions || 'h:h';

  var xmid, ymid;

  // one point, next to a
  if (directions === 'h:v') {
    return [ { x: b.x, y: a.y } ];
  } else
  // one point, above a
  if (directions === 'v:h') {
    return [ { x: a.x, y: b.y } ];
  } else
  // vertical edge xmid
  if (directions === 'h:h') {
    xmid = Math.round((b.x - a.x) / 2 + a.x);

    return [
      { x: xmid, y: a.y },
      { x: xmid, y: b.y }
    ];
  } else
  // horizontal edge ymid
  if (directions === 'v:v') {
    ymid = Math.round((b.y - a.y) / 2 + a.y);

    return [
      { x: a.x, y: ymid },
      { x: b.x, y: ymid }
    ];
  } else {
    throw new Error(
      'unknown directions: <' + directions + '>: ' +
      'directions must be specified as {a direction}:{b direction} (direction in h|v)');
  }
};


/**
 * Create a connection between the two points according
 * to the manhattan layout (only horizontal and vertical) edges.
 *
 * @param {Point} a
 * @param {Point} b
 *
 * @param {String} [directions='h:h'] specifies manhattan directions for each point as {adirection}:{bdirection}.
                   A directionfor a point is either `h` (horizontal) or `v` (vertical)
 *
 * @return {Array<Point>}
 */
module.exports.connectPoints = function(a, b, directions) {

  var points = [];

  if (!LayoutUtil.pointsAligned(a, b)) {
    points = this.getMidPoints(a, b, directions);
  }

  points.unshift(a);
  points.push(b);

  return points;
};


/**
 * Connect two rectangles using a manhattan layouted connection.
 *
 * @param {Bounds} source source rectangle
 * @param {Bounds} target target rectangle
 * @param {Point} [start] source docking
 * @param {Point} [end] target docking
 *
 * @return {Array<Point>} connection points
 */
module.exports.connectRectangles = function(source, target, start, end) {

  var orientation = LayoutUtil.getOrientation(source, target, MIN_DISTANCE);

  var directions = this.getDirections(source, target);

  start = start || LayoutUtil.getMidPoint(source);
  end = end || LayoutUtil.getMidPoint(target);

  // overlapping elements
  if (!directions) {
    return;
  }

  if (directions === 'h:h') {

    switch (orientation) {
      case 'top-right':
      case 'right':
      case 'bottom-right':
        start = { original: start, x: source.x, y: start.y };
        end = { original: end, x: target.x + target.width, y: end.y };
        break;
      case 'top-left':
      case 'left':
      case 'bottom-left':
        start = { original: start, x: source.x + source.width, y: start.y };
        end = { original: end, x: target.x, y: end.y };
        break;
    }
  }

  if (directions === 'v:v') {

    switch (orientation) {
      case 'top-left':
      case 'top':
      case 'top-right':
        start = { original: start, x: start.x, y: source.y + source.height };
        end = { original: end, x: end.x, y: target.y };
        break;
      case 'bottom-left':
      case 'bottom':
      case 'bottom-right':
        start = { original: start, x: start.x, y: source.y };
        end = { original: end, x: end.x, y: target.y + target.height };
        break;
    }
  }

  return this.connectPoints(start, end, directions);
};

/**
 * Repair the connection between two rectangles, of which one has been updated.
 *
 * @param  {Bounds} source
 * @param  {Bounds} target
 * @param  {Point} [start]
 * @param  {Point} [end]
 * @param  {Array<Point>} waypoints
 *
 * @return {Array<Point>} repaired waypoints
 */
module.exports.repairConnection = function(source, target, start, end, waypoints) {

  if (_.isArray(start)) {
    waypoints = start;

    start = LayoutUtil.getMidPoint(source);
    end = LayoutUtil.getMidPoint(target);
  }

  // just layout non-existing or simple connections
  if (!waypoints || waypoints.length < 3) {
    // simply reconnect
    return this.connectRectangles(source, target, start, end);
  }

  // check if we layout from start or end
  var endChanged = LayoutUtil.pointsEqual(waypoints[0].original || waypoints[0], start);

  var repairedWaypoints;

  if (endChanged) {
    repairedWaypoints = this._repairConnectionSide(target, source, end, waypoints.slice().reverse());
    repairedWaypoints = repairedWaypoints && repairedWaypoints.reverse();
  } else {
    repairedWaypoints = this._repairConnectionSide(source, target, start, waypoints);
  }

  // force relayout if repair fails
  if (!repairedWaypoints) {
    return this.connectRectangles(source, target, start, end);
  }

  return repairedWaypoints;
};

/**
 * Repair a connection from one side that moved.
 *
 * @param  {Bounds} moved
 * @param  {Bounds} other
 * @param  {Point} newDocking
 * @param  {Array<Point>} points originalPoints from moved to other
 *
 * @return {Array<Point>} the repaired points between the two rectangles
 */
module.exports._repairConnectionSide = function(moved, other, newDocking, points) {

  function needsRelayout(moved, other, points) {

    if (points.length < 3) {
      return true;
    }

    if (points.length > 4) {
      return false;
    }

    // relayout if two points overlap
    // this is most likely due to
    return !!_.find(points, function(p, idx) {
      var q = points[idx - 1];

      return q && Geometry.distance(p, q) < 3;
    });
  }

  function repairBendpoint(candidate, oldPeer, newPeer) {

    var alignment = LayoutUtil.pointsAligned(oldPeer, candidate);

    switch (alignment) {
      case 'v':
        // repair vertical alignment
        return { x: candidate.x, y: newPeer.y };
      case 'h':
        // repair horizontal alignment
        return { x: newPeer.x, y: candidate.y };
    }

    return { x: candidate.x, y: candidate. y };
  }

  function removeOverlapping(points, a, b) {
    var i;

    for (i = points.length - 2; i !== 0; i--) {

      // intersects (?) break, remove all bendpoints up to this one and relayout
      if (Geometry.pointInRect(points[i], a, MIN_DISTANCE) ||
          Geometry.pointInRect(points[i], b, MIN_DISTANCE)) {

        // return sliced old connection
        return points.slice(i);
      }
    }

    return points;
  }


  // (0) only repair what has layoutable bendpoints

  // (1) if only one bendpoint and on shape moved onto other shapes axis
  //     (horizontally / vertically), relayout

  if (needsRelayout(moved, other, points)) {
    return null;
  }

  var oldDocking = points[0],
      newPoints = points.slice(),
      slicedPoints;

  // (2) repair only last line segment and only if it was layouted before

  newPoints[0] = newDocking;
  newPoints[1] = repairBendpoint(newPoints[1], oldDocking, newDocking);


  // (3) if shape intersects with any bendpoint after repair,
  //     remove all segments up to this bendpoint and repair from there

  slicedPoints = removeOverlapping(newPoints, moved, other);
  if (slicedPoints !== newPoints) {
    return this._repairConnectionSide(moved, other, newDocking, slicedPoints);
  }

  return newPoints;
};

/**
 * Returns the default manhattan directions connecting two rectangles.
 *
 * @param {Bounds} source
 * @param {Bounds} target
 * @param {Boolean} preferVertical
 *
 * @return {String}
 */
module.exports.getDirections = function(source, target, preferVertical) {
  var orientation = LayoutUtil.getOrientation(source, target, MIN_DISTANCE);

  switch (orientation) {
    case 'intersect':
      return null;

    case 'top':
    case 'bottom':
      return 'v:v';

    case 'left':
    case 'right':
      return 'h:h';

    default:
      return preferVertical ? 'v:v' : 'h:h';
  }
};
},{}],141:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Snap = (window.Snap);

/**
 * Returns whether two points are in a horizontal or vertical line.
 *
 * @param {Point} a
 * @param {Point} b
 *
 * @return {String|Boolean} returns false if the points are not
 *                          aligned or 'h|v' if they are aligned
 *                          horizontally / vertically.
 */
function pointsAligned(a, b) {
  switch (true) {
    case a.x === b.x:
      return 'h';
    case a.y === b.y:
      return 'v';
  }

  return false;
}

module.exports.pointsAligned = pointsAligned;


function roundPoint(point) {

  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}

module.exports.roundPoint = roundPoint;


function pointsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

module.exports.pointsEqual = pointsEqual;


function pointDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

module.exports.pointDistance = pointDistance;


function asTRBL(bounds) {
  return {
    top: bounds.y,
    right: bounds.x + (bounds.width || 0),
    bottom: bounds.y + (bounds.height || 0),
    left: bounds.x
  };
}

module.exports.asTRBL = asTRBL;


function getMidPoint(bounds) {
  return roundPoint({
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  });
}

module.exports.getMidPoint = getMidPoint;


////// orientation utils //////////////////////////////

function getOrientation(rect, reference, pointDistance) {

  pointDistance = pointDistance || 0;

  var rectOrientation = asTRBL(rect),
      referenceOrientation = asTRBL(reference);

  var top = rectOrientation.bottom + pointDistance <= referenceOrientation.top,
      right = rectOrientation.left - pointDistance >= referenceOrientation.right,
      bottom = rectOrientation.top - pointDistance >= referenceOrientation.bottom,
      left = rectOrientation.right + pointDistance <= referenceOrientation.left;

  var vertical = top ? 'top' : (bottom ? 'bottom' : null),
      horizontal = left ? 'left' : (right ? 'right' : null);

  if (horizontal && vertical) {
    return vertical + '-' + horizontal;
  } else
  if (horizontal || vertical) {
    return horizontal || vertical;
  } else {
    return 'intersect';
  }
}

module.exports.getOrientation = getOrientation;


function hasAnyOrientation(rect, reference, pointDistance, locations) {

  if (_.isArray(pointDistance)) {
    locations = pointDistance;
    pointDistance = 0;
  }

  var orientation = getOrientation(rect, reference, pointDistance);

  return locations.indexOf(orientation) !== -1;
}

module.exports.hasAnyOrientation = hasAnyOrientation;



////// path utils //////////////////////////////

function getShapePath(gfx, bounds)  {

  var path = toPath(gfx),
      transformMatrix = bounds ? new Snap.Matrix(1, 0, 0, 1, bounds.x, bounds.y) : gfx.attr('transform').localMatrix;

  return Snap.path.map(path, transformMatrix);
}

module.exports.getShapePath = getShapePath;


function getConnectionPath(points) {

  // create a connection path from the connections waypoints
  return _.collect(points, function(p, idx) {
    p = p.original || p;
    return (idx ? 'L' : 'M') + p.x + ' ' + p.y;
  }).join('');
}

module.exports.getConnectionPath = getConnectionPath;


/**
 * Transforms a graphical object into a path representation
 *
 * @param  {SVGElement} gfx
 *
 * @return {Path}       a representation of the object as a path
 */
function toPath(gfx) {
  var visual = gfx.select('.djs-visual *');
  return Snap.path.get[visual.type](visual);
}

module.exports.toPath = toPath;


function getElementLineIntersection(elementPath, linePath, takeFirst) {

  var intersections = getIntersections(elementPath, linePath);

  // recognize intersections
  // only one -> choose
  // two close together -> choose first
  // two or more distinct -> throw
  // none -> ok (fallback to point itself)
  if (intersections.length === 1) {
    return roundPoint(intersections[0]);
  } else if (intersections.length === 2 && pointDistance(intersections[0], intersections[1]) < 1) {
    return roundPoint(intersections[0]);
  } else if (intersections.length > 1) {

    // searching for first intersection
    intersections = _.sortBy(intersections, function(i) {
      return i.segment2;
    });

    return roundPoint(intersections[takeFirst ? 0 : intersections.length - 1]);
  }

  return null;
}

module.exports.getElementLineIntersection = getElementLineIntersection;


function getIntersections(a, b) {
  return Snap.path.intersection(a, b);
}

module.exports.getIntersections = getIntersections;
},{}],142:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var Refs = _dereq_(163);

var parentRefs = new Refs({ name: 'children', enumerable: true, collection: true }, { name: 'parent' }),
    labelRefs = new Refs({ name: 'label', enumerable: true }, { name: 'labelTarget' }),
    outgoingRefs = new Refs({ name: 'outgoing', collection: true }, { name: 'source' }),
    incomingRefs = new Refs({ name: 'incoming', collection: true }, { name: 'target' });

/**
 * @namespace djs.model
 */

/**
 * @memberOf djs.model
 */

/**
 * The basic graphical representation
 *
 * @class
 *
 * @abstract
 */
function Base() {

  /**
   * The object that backs up the shape
   *
   * @name Base#businessObject
   * @type Object
   */
  Object.defineProperty(this, 'businessObject', {
    writable: true
  });

  /**
   * The parent shape
   *
   * @name Base#parent
   * @type Shape
   */
  parentRefs.bind(this, 'parent');

  /**
   * @name Base#label
   * @type Label
   */
  labelRefs.bind(this, 'label');

  /**
   * The list of outgoing connections
   *
   * @name Base#outgoing
   * @type Array<Connection>
   */
  outgoingRefs.bind(this, 'outgoing');

  /**
   * The list of outgoing connections
   *
   * @name Base#incoming
   * @type Array<Connection>
   */
  incomingRefs.bind(this, 'incoming');
}


/**
 * A graphical object
 *
 * @class
 * @constructor
 *
 * @extends Base
 */
function Shape() {
  Base.call(this);

  /**
   * The list of children
   *
   * @name Shape#children
   * @type Array<Base>
   */
  parentRefs.bind(this, 'children');
}

Shape.prototype = Object.create(Base.prototype);


/**
 * A root graphical object
 *
 * @class
 * @constructor
 *
 * @extends Shape
 */
function Root() {
  Shape.call(this);
}

Root.prototype = Object.create(Shape.prototype);


/**
 * A label for an element
 *
 * @class
 * @constructor
 *
 * @extends Shape
 */
function Label() {
  Shape.call(this);

  /**
   * The labeled element
   *
   * @name Label#labelTarget
   * @type Base
   */
  labelRefs.bind(this, 'labelTarget');
}

Label.prototype = Object.create(Shape.prototype);


/**
 * A connection between two elements
 *
 * @class
 * @constructor
 *
 * @extends Base
 */
function Connection() {
  Base.call(this);

  /**
   * The element this connection originates from
   *
   * @name Connection#source
   * @type Base
   */
  outgoingRefs.bind(this, 'source');

  /**
   * The element this connection points to
   *
   * @name Connection#target
   * @type Base
   */
  incomingRefs.bind(this, 'target');
}

Connection.prototype = Object.create(Base.prototype);


var types = {
  connection: Connection,
  shape: Shape,
  label: Label,
  root: Root
};

/**
 * Creates a new model element of the specified type
 *
 * @method create
 *
 * @example
 *
 * var shape1 = Model.create('shape', { x: 10, y: 10, width: 100, height: 100 });
 * var shape2 = Model.create('shape', { x: 210, y: 210, width: 100, height: 100 });
 *
 * var connection = Model.create('connection', { waypoints: [ { x: 110, y: 55 }, {x: 210, y: 55 } ] });
 *
 * @param  {String} type lower-cased model name
 * @param  {Object} attrs attributes to initialize the new model instance with
 *
 * @return {Base} the new model instance
 */
module.exports.create = function(type, attrs) {
  var Type = types[type];
  if (!Type) {
    throw new Error('unknown type: <' + type + '>');
  }
  return _.extend(new Type(), attrs);
};


module.exports.Base = Base;
module.exports.Root = Root;
module.exports.Shape = Shape;
module.exports.Connection = Connection;
module.exports.Label = Label;
},{}],143:[function(_dereq_,module,exports){
var Cursor = _dereq_(149),
    Dom = _dereq_(150),
    Event = _dereq_(152);

function substract(p1, p2) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y
  };
}

function length(point) {
  return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
}


var THRESHOLD = 15;


function MoveCanvas(eventBus, canvas) {

  var container = canvas._container,
      context;


  function handleMove(event) {

    var start = context.start,
        position = Event.toPoint(event),
        delta = substract(position, start);

    if (!context.dragging && length(delta) > THRESHOLD) {
      context.dragging = true;

      Cursor.set('move');
    }

    if (context.dragging) {

      var lastPosition = context.last || context.start;

      delta = substract(position, lastPosition);

      canvas.scroll({
        dx: delta.x,
        dy: delta.y
      });

      context.last = position;
    }

    // prevent select
    event.preventDefault();
  }


  function handleEnd(event) {
    Dom.off(document, 'mousemove', handleMove);
    Dom.off(document, 'mouseup', handleEnd);

    context = null;

    Cursor.unset();

    // prevent select
    Event.stopEvent(event);
  }

  function handleStart(event) {

    // reject non-left mouse button drags
    // left = 0
    // left click + alt pressed is reserved for other use
    if (event.button ||  event.altKey) {
      return;
    }

    context = {
      start: Event.toPoint(event)
    };

    Dom.on(document, 'mousemove', handleMove);
    Dom.on(document, 'mouseup', handleEnd);

    // prevent select
    Event.stopEvent(event);
  }

  Dom.on(container, 'mousedown', handleStart);
}


MoveCanvas.$inject = [ 'eventBus', 'canvas' ];

module.exports = MoveCanvas;

},{}],144:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'moveCanvas' ],
  moveCanvas: [ 'type', _dereq_(143) ]
};
},{}],145:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(138) ]
};
},{}],146:[function(_dereq_,module,exports){
'use strict';

var $ = (window.$);

var mousewheel = (window.$);
if (mousewheel !== $ && !$.mousewheel) { mousewheel($); }


function ZoomScroll(events, canvas) {

  var RANGE = { min: 0.2, max: 4 };

  var ZOOM_OFFSET = 5;
  var SCROLL_OFFSET = 50;

  function cap(scale) {
    return Math.max(RANGE.min, Math.min(RANGE.max, scale));
  }

  function reset() {
    canvas.zoom('fit-viewport');
  }

  function zoom(direction, position) {

    var currentZoom = canvas.zoom();
    var factor = 1 + (direction / ZOOM_OFFSET);

    canvas.zoom(cap(currentZoom * factor), position);
  }


  function init(element) {

    $(element).on('mousewheel', function(event) {

      var shift = event.shiftKey,
          ctrl = event.ctrlKey;

      var x = event.deltaX,
          y = event.deltaY;

      if (shift || ctrl) {
        var delta = {};

        if (ctrl) {
          delta.dx = SCROLL_OFFSET * x;
        } else {
          delta.dy = SCROLL_OFFSET * x;
        }

        canvas.scroll(delta);
      } else {
        var offset = {};

        // Gecko Browser should use _offsetX
        if(!event.originalEvent.offsetX) {
          offset = {
            x: event.originalEvent.layerX,
            y: event.originalEvent.layerY
          };
        } else {
          offset = {
            x: event.offsetX,
            y: event.offsetY
          };
        }

        // zoom in relative to diagram {x,y} coordinates
        zoom(y, offset);
      }

      event.preventDefault();
    });
  }

  events.on('canvas.init', function(e) {
    init(e.svg.node);
  });

  // API
  this.zoom = zoom;
  this.reset = reset;
}


ZoomScroll.$inject = [ 'eventBus', 'canvas' ];

module.exports = ZoomScroll;


},{}],147:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'zoomScroll' ],
  zoomScroll: [ 'type', _dereq_(146) ]
};
},{}],148:[function(_dereq_,module,exports){
'use strict';

/**
 * Failsafe remove an element from a collection
 *
 * @param  {Array<Object>} [collection]
 * @param  {Object} [element]
 *
 * @return {Object} the element that got removed or undefined
 */
module.exports.remove = function(collection, element) {

  if (!collection || !element) {
    return;
  }

  var idx = collection.indexOf(element);
  if (idx === -1) {
    return;
  }

  collection.splice(idx, 1);

  return element;
};

/**
 * Fail save add an element to the given connection, ensuring
 * it does not yet exist.
 *
 * @param {Array<Object>} collection
 * @param {Object} element
 * @param {Number} idx
 */
module.exports.add = function(collection, element, idx) {

  if (!collection || !element) {
    return;
  }

  if (isNaN(idx)) {
    idx = -1;
  }

  var currentIdx = collection.indexOf(element);

  if (currentIdx !== -1) {

    if (currentIdx === idx) {
      // nothing to do, position has not changed
      return;
    } else {

      if (idx !== -1) {
        // remove from current position
        collection.splice(currentIdx, 1);
      } else {
        // already exists in collection
        return;
      }
    }
  }

  if (idx !== -1) {
    // insert at specified position
    collection.splice(idx, 0, element);
  } else {
    // push to end
    collection.push(element);
  }
};


/**
 * Fail get the index of an element in a collection.
 *
 * @param {Array<Object>} collection
 * @param {Object} element
 *
 * @return {Number} the index or -1 if collection or element do
 *                  not exist or the element is not contained.
 */
module.exports.indexOf = function(collection, element) {

  if (!collection || !element) {
    return -1;
  }

  return collection.indexOf(element);
};

},{}],149:[function(_dereq_,module,exports){
'use strict';

var _ = (window._);

var CURSOR_CLS_PATTERN = /^djs-cursor-.*$/;


module.exports.set = function(mode) {
  var classList = document.body.classList;

  _.forEach(_.clone(classList), function(cls) {
    if (CURSOR_CLS_PATTERN.test(cls)) {
      classList.remove(cls);
    }
  });

  if (mode) {
    classList.add('djs-cursor-' + mode);
  }
};

module.exports.unset = function() {
  this.set(null);
};
},{}],150:[function(_dereq_,module,exports){

var elementProto = Element.prototype;

// TODO(nre): remove if we drop support for PhantomJS 1.9

var matchPolyfill = function(selector) {

  var element = this;
  var matches = (element.document || element.ownerDocument).querySelectorAll(selector);
  var i = 0;

  while (matches[i] && matches[i] !== element) {
    i++;
  }

  return matches[i] ? true : false;
};


var matchFn = elementProto.matches ||
              elementProto.mozMatchesSelector ||
              elementProto.webkitMatchesSelecor ||
              elementProto.msMatchesSelector || matchPolyfill;


/**
 * Returns true if an element matches the given selector
 *
 * @param  {Element} element
 * @param  {String} selector
 *
 * @return {Boolean}
 */
function matches(element, selector) {
  return matchFn.call(element, selector);
}

module.exports.matches = matches;


/**
 * Gets the closest parent node of the element matching the given selector
 *
 * @param  {Element} element
 * @param  {String} selector
 *
 * @return {Element} the matching parent
 */
function closest(element, selector) {
  while (element) {
    if (element instanceof Element) {
      if (matches(element, selector)) {
        return element;
      } else {
        element = element.parentNode;
      }
    } else {
      break;
    }
  }

  return null;
}

module.exports.closest = closest;


function clear(element) {
  while (element.childNodes.length) {
    element.removeChild(element.childNodes[0]);
  }
}

module.exports.clear = clear;


function on(element, type, fn, useCapture) {
  element.addEventListener(type, fn, useCapture || false);
}

module.exports.on = on;


function off(element, type, fn, useCapture) {
  element.removeEventListener(type, fn, useCapture || false);
}

module.exports.off = off;

function once(element, type, fn, useCapture) {

  var wrappedFn = function(e) {
    fn(e);

    off(element, type, wrappedFn, useCapture);
  };

  on(element, type, wrappedFn, useCapture);
}

module.exports.once = once;
},{}],151:[function(_dereq_,module,exports){
var _ = (window._);

/**
 * Adds an element to a collection and returns true if the
 * element was added.
 *
 * @param {Array<Object>} elements
 * @param {Object} e
 * @param {Boolean} unique
 */
function add(elements, e, unique) {
  var canAdd = !unique || elements.indexOf(e) === -1;

  if (canAdd) {
    elements.push(e);
  }

  return canAdd;
}

function eachElement(elements, fn, depth) {

  depth = depth || 0;

  _.forEach(elements, function(s, i) {
    var filter = fn(s, i, depth);

    if (_.isArray(filter) && filter.length) {
      eachElement(filter, fn, depth + 1);
    }
  });
}

/**
 * Collects self + child elements up to a given depth from a list of elements.
 *
 * @param  {Array<djs.model.Base>} elements the elements to select the children from
 * @param  {Boolean} unique whether to return a unique result set (no duplicates)
 * @param  {Number} maxDepth the depth to search through or -1 for infinite
 *
 * @return {Array<djs.model.Base>} found elements
 */
function selfAndChildren(elements, unique, maxDepth) {
  var result = [],
      processedChildren = [];

  eachElement(elements, function(element, i, depth) {
    add(result, element, unique);

    var children = element.children;

    // max traversal depth not reached yet
    if (maxDepth === -1 || depth < maxDepth) {

      // children exist && children not yet processed
      if (children && add(processedChildren, children, unique)) {
        return children;
      }
    }
  });

  return result;
}

/**
 * Return self + direct children for a number of elements
 *
 * @param  {Array<djs.model.Base>} elements to query
 * @param  {Boolean} allowDuplicates to allow duplicates in the result set
 *
 * @return {Array<djs.model.Base>} the collected elements
 */
function selfAndDirectChildren(elements, allowDuplicates) {
  return selfAndChildren(elements, !allowDuplicates, 1);
}

/**
 * Return self + ALL children for a number of elements
 *
 * @param  {Array<djs.model.Base>} elements to query
 * @param  {Boolean} allowDuplicates to allow duplicates in the result set
 *
 * @return {Array<djs.model.Base>} the collected elements
 */
function selfAndAllChildren(elements, allowDuplicates) {
  return selfAndChildren(elements, !allowDuplicates, -1);
}

/**
 * Gets the the closure fo all selected elements,
 * their connections and
 *
 * @param {Array<djs.model.Base>} elements
 * @return {Object} enclosure
 */
function getClosure(elements) {

  // original elements passed to this function
  var topLevel = _.groupBy(elements, function(e) { return e.id; });

  var allShapes = {},
      allConnections = {},
      enclosedElements = {},
      enclosedConnections = {};

  function handleConnection(c) {
    if (topLevel[c.source.id] && topLevel[c.target.id]) {
      topLevel[c.id] = c;
    }

    // not enclosed as a child, but maybe logically
    // (connecting two moved elements?)
    if (allShapes[c.source.id] && allShapes[c.target.id]) {
      enclosedConnections[c.id] = enclosedElements[c.id] = c;
    }

    allConnections[c.id] = c;
  }

  function handleElement(element) {

    enclosedElements[element.id] = element;

    if (element.waypoints) {
      // remember connection
      enclosedConnections[element.id] = allConnections[element.id] = element;
    } else {
      // remember shape
      allShapes[element.id] = element;

      // remember all connections
      _.forEach(element.incoming, handleConnection);

      _.forEach(element.outgoing, handleConnection);

      // recurse into children
      return element.children;
    }
  }

  eachElement(elements, handleElement);

  return {
    allShapes: allShapes,
    allConnections: allConnections,
    topLevel: topLevel,
    enclosedConnections: enclosedConnections,
    enclosedElements: enclosedElements
  };
}

/**
 * Returns the surrounding bbox for all elements in the array or the element primitive.
 */
function getBBox(elements, stopRecursion) {

  stopRecursion = !!stopRecursion;
  if (!_.isArray(elements)) {
    elements = [elements];
  }

  var minX,
      minY,
      maxX,
      maxY;

  _.forEach(elements, function(element) {

    // If element is a connection the bbox must be computed first
    var bbox = element;
    if (element.waypoints && !stopRecursion) {
      bbox = getBBox(element.waypoints, true);
    }

    var x = bbox.x,
        y = bbox.y,
        height = bbox.height || 0,
        width  = bbox.width  || 0;

    if (x < minX || minX === undefined) {
      minX = x;
    }
    if (y < minY || minY === undefined) {
      minY = y;
    }

    if ((x + width) > maxX || maxX === undefined) {
      maxX = x + width;
    }
    if ((y + height) > maxY || maxY === undefined) {
      maxY = y + height;
    }
  });

  return {
    x: minX,
    y: minY,
    height: maxY - minY,
    width: maxX - minX
  };
}


/**
 * Returns all elements that are enclosed from the bounding box.
 *
 * @param {Array<Object>} elements List of Elements to search through
 * @param {Object} bbox the enclosing bbox.
 * <ul>
 *  <li>If bbox.(width|height) is not specified
 * the method returns all elements with element.x/y &gt; bbox.x/y
 * </li>
 *  <li>If only bbox.x or bbox.y is specified, method return all elements with
 *  e.x &gt; bbox.x or e.y &gt; bbox.y.</li>
 * </ul>
 *
 */
function getEnclosedElements(elements, bbox) {

  var filteredElements = {};

  _.forEach(elements, function(element) {

    var e = element;

    if (e.waypoints) {
      e = getBBox(e);
    }

    if (!_.isNumber(bbox.y) && (e.x > bbox.x)) {
      filteredElements[element.id] = element;
    }
    if (!_.isNumber(bbox.x) && (e.y > bbox.y)) {
      filteredElements[element.id] = element;
    }
    if (e.x > bbox.x && e.y > bbox.y) {
      if (_.isNumber(bbox.width) && _.isNumber(bbox.height) &&
          e.width  + e.x < bbox.width  + bbox.x &&
          e.height + e.y < bbox.height + bbox.y) {

        filteredElements[element.id] = element;
      } else if (!_.isNumber(bbox.width) || !_.isNumber(bbox.height)) {
        filteredElements[element.id] = element;
      }
    }
  });

  return filteredElements;
}



module.exports.eachElement = eachElement;
module.exports.selfAndDirectChildren = selfAndDirectChildren;
module.exports.selfAndAllChildren = selfAndAllChildren;
module.exports.getBBox = getBBox;
module.exports.getEnclosedElements = getEnclosedElements;

module.exports.getClosure = getClosure;

},{}],152:[function(_dereq_,module,exports){
function __preventDefault(event) {
  return event && event.preventDefault();
}

function __stopPropagation(event, immediate) {
  if (!event) {
    return;
  }

  if (event.stopPropagation) {
    event.stopPropagation();
  }

  if (immediate && event.stopImmediatePropagation) {
    event.stopImmediatePropagation();
  }
}


function getOriginal(event) {
  return event.originalEvent || event.srcEvent;
}

module.exports.getOriginal = getOriginal;


function stopEvent(event, immediate) {
  stopPropagation(event, immediate);
  preventDefault(event);
}

module.exports.stopEvent = stopEvent;


function preventDefault(event) {
  __preventDefault(event);
  __preventDefault(getOriginal(event));
}

module.exports.preventDefault = preventDefault;


function stopPropagation(event, immediate) {
  __stopPropagation(event, immediate);
  __stopPropagation(getOriginal(event), immediate);
}

module.exports.stopPropagation = stopPropagation;


function toPoint(event) {

  if (event.pointers && event.pointers.length) {
    event = event.pointers[0];
  }

  if (event.touches && event.touches.length) {
    event = event.touches[0];
  }

  return event ? {
    x: event.clientX,
    y: event.clientY
  } : null;
}

module.exports.toPoint = toPoint;

},{}],153:[function(_dereq_,module,exports){
/**
 * Computes the distance between two points
 *
 * @param  {Point}  p
 * @param  {Point}  q
 *
 * @return {Number}  distance
 */
var distance = module.exports.distance = function(p, q) {
  return Math.sqrt(Math.pow(q.x - p.x, 2) + Math.pow(q.y - p.y, 2));
};

/**
 * Returns true if the point r is on the line between p and y
 *
 * @param  {Point}  p
 * @param  {Point}  q
 * @param  {Point}  r
 *
 * @return {Boolean}
 */
module.exports.pointsOnLine = function(p, q, r) {

  if (!p || !q || !r) {
    return false;
  }

  var val = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x),
      dist = distance(p, q);

  // @see http://stackoverflow.com/a/907491/412190
  return Math.abs(val / dist) < 5;
};

module.exports.pointInRect = function(p, rect, tolerance) {
  tolerance = tolerance || 0;

  return p.x > rect.x - tolerance &&
         p.y > rect.y - tolerance &&
         p.x < rect.x + rect.width + tolerance &&
         p.y < rect.y + rect.height + tolerance;
};
},{}],154:[function(_dereq_,module,exports){
/**
 * SVGs for elements are generated by the {@link GraphicsFactory}.
 *
 * This utility gives quick access to the important semantic
 * parts of an element.
 */

/**
 * Returns the visual part of a diagram element
 *
 * @param {Snap<SVGElement>} gfx
 *
 * @return {Snap<SVGElement>}
 */
function getVisual(gfx) {
  return gfx.select('.djs-visual');
}

/**
 * Returns the children for a given diagram element.
 *
 * @param {Snap<SVGElement>} gfx
 * @return {Snap<SVGElement>}
 */
function getChildren(gfx) {
  return gfx.parent().children()[1];
}

/**
 * Returns the visual bbox of an element
 *
 * @param {Snap<SVGElement>} gfx
 *
 * @return {Bounds}
 */
function getBBox(gfx) {
  return getVisual(gfx).select('*').getBBox();
}


module.exports.getVisual = getVisual;
module.exports.getChildren = getChildren;
module.exports.getBBox = getBBox;
},{}],155:[function(_dereq_,module,exports){
'use strict';

/**
 * Util that provides unique IDs.
 *
 * @class djs.util.IdGenerator
 * @memberOf djs.util
 *
 * @constructor
 *
 * The ids can be customized via a given prefix and contain a random value to avoid collisions.
 *
 * @param {String} prefix a prefix to prepend to generated ids (for better readability)
 */
function IdGenerator(prefix) {

  this._counter = 0;
  this._prefix = (prefix ? prefix + '-' : '') + Math.floor(Math.random() * 1000000000) + '-';
}

module.exports = IdGenerator;

/**
 * Returns a next unique ID.
 *
 * @method djs.util.IdGenerator#next
 *
 * @returns {String} the id
 */
IdGenerator.prototype.next = function() {
  return this._prefix + (++this._counter);
};

},{}],156:[function(_dereq_,module,exports){
'use strict';

var Snap = (window.Snap);
var _ = (window._);

var DEFAULT_BOX_PADDING = 0;

var DEFAULT_LABEL_SIZE = {
  width: 150,
  height: 50
};


function parseAlign(align) {

  var parts = align.split('-');

  return {
    horizontal: parts[0] || 'center',
    vertical: parts[1] || 'top'
  };
}

function parsePadding(padding) {

  if (_.isObject(padding)) {
    return _.extend({ top: 0, left: 0, right: 0, bottom: 0 }, padding);
  } else {
    return {
      top: padding,
      left: padding,
      right: padding,
      bottom: padding
    };
  }
}


/**
 * Creates a new label utility
 *
 * @param {Object} config
 * @param {Dimensions} config.size
 * @param {Number} config.padding
 * @param {Object} config.style
 * @param {String} config.align
 */
function Text(config) {

  this._config = _.extend({}, {
    size: DEFAULT_LABEL_SIZE,
    padding: DEFAULT_BOX_PADDING,
    style: {},
    align: 'center-top'
  }, config || {});
}

/**
 * Create a label in the parent node.
 *
 * @method Text#createText
 *
 * @param {SVGElement} parent the parent to draw the label on
 * @param {String} text the text to render on the label
 * @param {Object} options
 * @param {String} options.align how to align in the bounding box.
 *                             Any of { 'center-middle', 'center-top' }, defaults to 'center-top'.
 * @param {String} options.style style to be applied to the text
 *
 * @return {SVGText} the text element created
 */
Text.prototype.createText = function(parent, text, options) {

  var box = _.merge({}, this._config.size, options.box || {}),
      style = _.merge({}, this._config.style, options.style || {}),
      align = parseAlign(options.align || this._config.align),
      padding = parsePadding(options.padding !== undefined ? options.padding : this._config.padding);

  var lines = text.split(/\r?\n/g),
      layouted = [];

  var maxWidth = box.width - padding.left - padding.right;

  var fakeText = parent.text(0, 0, '').attr(style).node;
  // FF regression: ensure text is shown during rendering
  // by attaching it directly to the body
  fakeText.ownerSVGElement.appendChild(fakeText);

  /**
   * Layout the next line and return the layouted element.
   *
   * Alters the lines passed.
   *
   * @param  {Array<String>} lines
   * @return {Object} the line descriptor, an object { width, height, text }
   */
  function layoutNext(lines) {

    var originalLine = lines.shift(),
        fitLine = originalLine;

    var textBBox;

    function fit() {
      if (fitLine.length < originalLine.length) {
        var nextLine = lines[0] || '',
            remainder = originalLine.slice(fitLine.length);

        if (/-\s*$/.test(remainder)) {
          nextLine = remainder.replace(/-\s*$/, '') + nextLine.replace(/^\s+/, '');
        } else {
          nextLine = remainder + ' ' + nextLine;
        }

        lines[0] = nextLine;
      }
      return { width: textBBox.width, height: textBBox.height, text: fitLine };
    }

    function getTextBBox(text) {
      fakeText.textContent = text;
      return fakeText.getBBox();
    }

    /**
     * Shortens a line based on spacing and hyphens.
     * Returns the shortened result on success.
     *
     * @param  {String} line
     * @param  {Number} maxLength the maximum characters of the string
     * @return {String} the shortened string
     */
    function semanticShorten(line, maxLength) {
      var parts = line.split(/(\s|-)/g),
          part,
          shortenedParts = [],
          length = 0;

      // try to shorten via spaces + hyphens
      if (parts.length > 1) {
        while ((part = parts.shift())) {

          if (part.length + length < maxLength) {
            shortenedParts.push(part);
            length += part.length;
          } else {
            // remove previous part, too if hyphen does not fit anymore
            if (part === '-') {
              shortenedParts.pop();
            }

            break;
          }
        }
      }

      return shortenedParts.join('');
    }

    function shortenLine(line, width, maxWidth) {
      var length = line.length * (maxWidth / width);

      // try to shorten semantically (i.e. based on spaces and hyphens)
      var shortenedLine = semanticShorten(line, length);

      if (!shortenedLine) {

        // force shorten by cutting the long word
        shortenedLine = line.slice(0, Math.floor(length - 1));
      }

      return shortenedLine;
    }


    while (true) {

      textBBox = getTextBBox(fitLine);

      // try to fit
      if (textBBox.width < maxWidth) {
        return fit();
      }

      fitLine = shortenLine(fitLine, textBBox.width, maxWidth);
    }
  }

  while (lines.length) {
    layouted.push(layoutNext(lines));
  }

  var totalHeight = _.reduce(layouted, function(sum, line, idx) {
    return sum + line.height;
  }, 0);

  // the y position of the next line
  var y, x;

  switch (align.vertical) {
    case 'middle':
      y = (box.height - totalHeight) / 2 - layouted[0].height / 4;
      break;

    default:
      y = padding.top;
  }

  var textElement = parent.text().attr(style);

  _.forEach(layouted, function(line) {
    y += line.height;

    switch (align.horizontal) {
      case 'left':
        x = padding.left;
        break;

      case 'right':
        x = (maxWidth - padding.right - line.width);
        break;

      default:
        // aka center
        x = (maxWidth - line.width) / 2 + padding.left;
    }


    var tspan = Snap.create('tspan', { x: x, y: y }).node;
    tspan.textContent = line.text;

    textElement.append(tspan);
  });

  // remove fake text
  fakeText.parentNode.removeChild(fakeText);

  return textElement;
};


module.exports = Text;
},{}],157:[function(_dereq_,module,exports){

var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var annotate = function() {
  var args = Array.prototype.slice.call(arguments);
  
  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  var fn = args.pop();

  fn.$inject = args;

  return fn;
};


// Current limitations:
// - can't put into "function arg" comments
// function /* (no parenthesis like this) */ (){}
// function abc( /* xx (no parenthesis like this) */ a, b) {}
//
// Just put the comment before function or inside:
// /* (((this is fine))) */ function(a, b) {}
// function abc(a) { /* (((this is fine))) */}

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG = /\/\*([^\*]*)\*\//m;

var parse = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Cannot annotate "' + fn + '". Expected a function!');
  }

  var match = fn.toString().match(FN_ARGS);
  return match[1] && match[1].split(',').map(function(arg) {
    match = arg.match(FN_ARG);
    return match ? match[1].trim() : arg.trim();
  }) || [];
};


exports.annotate = annotate;
exports.parse = parse;
exports.isArray = isArray;

},{}],158:[function(_dereq_,module,exports){
module.exports = {
  annotate: _dereq_(157).annotate,
  Module: _dereq_(160),
  Injector: _dereq_(159)
};

},{}],159:[function(_dereq_,module,exports){
var Module = _dereq_(160);
var autoAnnotate = _dereq_(157).parse;
var annotate = _dereq_(157).annotate;
var isArray = _dereq_(157).isArray;


var Injector = function(modules, parent) {
  parent = parent || {
    get: function(name) {
      currentlyResolving.push(name);
      throw error('No provider for "' + name + '"!');
    }
  };

  var currentlyResolving = [];
  var providers = this._providers = Object.create(parent._providers || null);
  var instances = this._instances = Object.create(null);

  var self = instances.injector = this;

  var error = function(msg) {
    var stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
  };

  var get = function(name) {
    if (!providers[name] && name.indexOf('.') !== -1) {
      var parts = name.split('.');
      var pivot = get(parts.shift());

      while(parts.length) {
        pivot = pivot[parts.shift()];
      }

      return pivot;
    }

    if (Object.hasOwnProperty.call(instances, name)) {
      return instances[name];
    }

    if (Object.hasOwnProperty.call(providers, name)) {
      if (currentlyResolving.indexOf(name) !== -1) {
        currentlyResolving.push(name);
        throw error('Cannot resolve circular dependency!');
      }

      currentlyResolving.push(name);
      instances[name] = providers[name][0](providers[name][1]);
      currentlyResolving.pop();

      return instances[name];
    }

    return parent.get(name);
  };

  var instantiate = function(Type) {
    var instance = Object.create(Type.prototype);
    var returned = invoke(Type, instance);

    return typeof returned === 'object' ? returned : instance;
  };

  var invoke = function(fn, context) {
    if (typeof fn !== 'function') {
      if (isArray(fn)) {
        fn = annotate(fn.slice());
      } else {
        throw new Error('Cannot invoke "' + fn + '". Expected a function!');
      }
    }

    var inject = fn.$inject && fn.$inject || autoAnnotate(fn);
    var dependencies = inject.map(function(dep) {
      return get(dep);
    });

    // TODO(vojta): optimize without apply
    return fn.apply(context, dependencies);
  };


  var createPrivateInjectorFactory = function(privateChildInjector) {
    return annotate(function(key) {
      return privateChildInjector.get(key);
    });
  };

  var createChild = function(modules, forceNewInstances) {
    if (forceNewInstances && forceNewInstances.length) {
      var fromParentModule = Object.create(null);
      var matchedScopes = Object.create(null);

      var privateInjectorsCache = [];
      var privateChildInjectors = [];
      var privateChildFactories = [];

      var provider;
      var cacheIdx;
      var privateChildInjector;
      var privateChildInjectorFactory;
      for (var name in providers) {
        provider = providers[name];

        if (forceNewInstances.indexOf(name) !== -1) {
          if (provider[2] === 'private') {
            cacheIdx = privateInjectorsCache.indexOf(provider[3]);
            if (cacheIdx === -1) {
              privateChildInjector = provider[3].createChild([], forceNewInstances);
              privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
              privateInjectorsCache.push(provider[3]);
              privateChildInjectors.push(privateChildInjector);
              privateChildFactories.push(privateChildInjectorFactory);
              fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
            } else {
              fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
            }
          } else {
            fromParentModule[name] = [provider[2], provider[1]];
          }
          matchedScopes[name] = true;
        }

        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
          forceNewInstances.forEach(function(scope) {
            if (provider[1].$scope.indexOf(scope) !== -1) {
              fromParentModule[name] = [provider[2], provider[1]];
              matchedScopes[scope] = true;
            }
          });
        }
      }

      forceNewInstances.forEach(function(scope) {
        if (!matchedScopes[scope]) {
          throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
        }
      });

      modules.unshift(fromParentModule);
    }

    return new Injector(modules, self);
  };

  var factoryMap = {
    factory: invoke,
    type: instantiate,
    value: function(value) {
      return value;
    }
  };

  modules.forEach(function(module) {

    function arrayUnwrap(type, value) {
      if (type !== 'value' && isArray(value)) {
        value = annotate(value.slice());
      }

      return value;
    }

    // TODO(vojta): handle wrong inputs (modules)
    if (module instanceof Module) {
      module.forEach(function(provider) {
        var name = provider[0];
        var type = provider[1];
        var value = provider[2];

        providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
      });
    } else if (typeof module === 'object') {
      if (module.__exports__) {
        var clonedModule = Object.keys(module).reduce(function(m, key) {
          if (key.substring(0, 2) !== '__') {
            m[key] = module[key];
          }
          return m;
        }, Object.create(null));

        var privateInjector = new Injector((module.__modules__ || []).concat([clonedModule]), self);
        var getFromPrivateInjector = annotate(function(key) {
          return privateInjector.get(key);
        });
        module.__exports__.forEach(function(key) {
          providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
        });
      } else {
        Object.keys(module).forEach(function(name) {
          if (module[name][2] === 'private') {
            providers[name] = module[name];
            return;
          }

          var type = module[name][0];
          var value = module[name][1];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      }
    }
  });

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;
};

module.exports = Injector;

},{}],160:[function(_dereq_,module,exports){
var Module = function() {
  var providers = [];

  this.factory = function(name, factory) {
    providers.push([name, 'factory', factory]);
    return this;
  };

  this.value = function(name, value) {
    providers.push([name, 'value', value]);
    return this;
  };

  this.type = function(name, type) {
    providers.push([name, 'type', type]);
    return this;
  };

  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };
};

module.exports = Module;

},{}],161:[function(_dereq_,module,exports){
'use strict';

var hat = _dereq_(162);


/**
 * Create a new id generator / cache instance.
 *
 * You may optionally provide a seed that is used internally.
 *
 * @param {Seed} seed
 */
function Ids(seed) {
  seed = seed || [ 128, 36, 1 ];
  this._seed = seed.length ? hat.rack(seed[0], seed[1], seed[2]) : seed;
}

module.exports = Ids;

/**
 * Generate a next id.
 *
 * @param {Object} [element] element to bind the id to
 *
 * @return {String} id
 */
Ids.prototype.next = function(element) {
  return this._seed(element || true);
};

/**
 * Generate a next id with a given prefix.
 *
 * @param {Object} [element] element to bind the id to
 *
 * @return {String} id
 */
Ids.prototype.nextPrefixed = function(prefix, element) {
  var id;

  do {
    id = prefix + this.next(true);
  } while (this.assigned(id));

  // claim {prefix}{random}
  this.claim(id, element);

  // return
  return id;
};

/**
 * Manually claim an existing id.
 *
 * @param {String} id
 * @param {String} [element] element the id is claimed by
 */
Ids.prototype.claim = function(id, element) {
  this._seed.set(id, element || true);
};

/**
 * Returns true if the given id has already been assigned.
 *
 * @param  {String} id
 * @return {Boolean}
 */
Ids.prototype.assigned = function(id) {
  return this._seed.get(id) || false;
};
},{}],162:[function(_dereq_,module,exports){
var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) bits += expandBy;
                else throw new Error('too many ID collisions, use more bits')
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};

},{}],163:[function(_dereq_,module,exports){
module.exports = _dereq_(165);

module.exports.Collection = _dereq_(164);
},{}],164:[function(_dereq_,module,exports){
'use strict';

/**
 * An empty collection stub. Use {@link RefsCollection.extend} to extend a
 * collection with ref semantics.
 *
 * @classdesc A change and inverse-reference aware collection with set semantics.
 *
 * @class RefsCollection
 */
function RefsCollection() { }

/**
 * Extends a collection with {@link Refs} aware methods
 *
 * @memberof RefsCollection
 * @static
 *
 * @param  {Array<Object>} collection
 * @param  {Refs} refs instance
 * @param  {Object} property represented by the collection
 * @param  {Object} target object the collection is attached to
 *
 * @return {RefsCollection<Object>} the extended array
 */
function extend(collection, refs, property, target) {

  var inverseProperty = property.inverse;

  /**
   * Removes the given element from the array and returns it.
   *
   * @method RefsCollection#remove
   *
   * @param {Object} element the element to remove
   */
  collection.remove = function(element) {
    var idx = this.indexOf(element);
    if (idx !== -1) {
      this.splice(idx, 1);

      // unset inverse
      refs.unset(element, inverseProperty, target);
    }

    return element;
  };

  /**
   * Returns true if the collection contains the given element
   *
   * @method RefsCollection#contains
   *
   * @param {Object} element the element to check for
   */
  collection.contains = function(element) {
    return this.indexOf(element) !== -1;
  };

  /**
   * Adds an element to the array, unless it exists already (set semantics).
   *
   * @method RefsCollection#add
   *
   * @param {Object} element the element to add
   */
  collection.add = function(element) {

    if (!this.contains(element)) {
      this.push(element);

      // set inverse
      refs.set(element, inverseProperty, target);
    }
  };

  return collection;
}


module.exports.extend = extend;
},{}],165:[function(_dereq_,module,exports){
'use strict';

var Collection = _dereq_(164);

function hasOwnProperty(e, property) {
  return Object.prototype.hasOwnProperty.call(e, property.name || property);
}


function defineCollectionProperty(ref, property, target) {
  Object.defineProperty(target, property.name, {
    enumerable: property.enumerable,
    value: Collection.extend(target[property.name] || [], ref, property, target)
  });
}


function defineProperty(ref, property, target) {

  var inverseProperty = property.inverse;

  var _value = target[property.name];

  Object.defineProperty(target, property.name, {
    enumerable: property.enumerable,

    get: function() {
      return _value;
    },

    set: function(value) {

      // return if we already performed all changes
      if (value === _value) {
        return;
      }

      var old = _value;

      // temporary set null
      _value = null;

      if (old) {
        ref.unset(old, inverseProperty, target);
      }

      // set new value
      _value = value;

      // set inverse value
      ref.set(_value, inverseProperty, target);
    }
  });

}

/**
 * Creates a new references object defining two inversly related
 * attribute descriptors a and b.
 *
 * <p>
 *   When bound to an object using {@link Refs#bind} the references
 *   get activated and ensure that add and remove operations are applied
 *   reversely, too.
 * </p>
 *
 * <p>
 *   For attributes represented as collections {@link Refs} provides the
 *   {@link RefsCollection#add}, {@link RefsCollection#remove} and {@link RefsCollection#contains} extensions
 *   that must be used to properly hook into the inverse change mechanism.
 * </p>
 *
 * @class Refs
 *
 * @classdesc A bi-directional reference between two attributes.
 *
 * @param {Refs.AttributeDescriptor} a property descriptor
 * @param {Refs.AttributeDescriptor} b property descriptor
 *
 * @example
 *
 * var refs = Refs({ name: 'wheels', collection: true, enumerable: true }, { name: 'car' });
 *
 * var car = { name: 'toyota' };
 * var wheels = [{ pos: 'front-left' }, { pos: 'front-right' }];
 *
 * refs.bind(car, 'wheels');
 *
 * car.wheels // []
 * car.wheels.add(wheels[0]);
 * car.wheels.add(wheels[1]);
 *
 * car.wheels // [{ pos: 'front-left' }, { pos: 'front-right' }]
 *
 * wheels[0].car // { name: 'toyota' };
 * car.wheels.remove(wheels[0]);
 *
 * wheels[0].car // undefined
 */
function Refs(a, b) {

  if (!(this instanceof Refs)) {
    return new Refs(a, b);
  }

  // link
  a.inverse = b;
  b.inverse = a;

  this.props = {};
  this.props[a.name] = a;
  this.props[b.name] = b;
}

/**
 * Binds one side of a bi-directional reference to a
 * target object.
 *
 * @memberOf Refs
 *
 * @param  {Object} target
 * @param  {String} property
 */
Refs.prototype.bind = function(target, property) {
  if (typeof property === 'string') {
    if (!this.props[property]) {
      throw new Error('no property <' + property + '> in ref');
    }
    property = this.props[property];
  }

  if (property.collection) {
    defineCollectionProperty(this, property, target);
  } else {
    defineProperty(this, property, target);
  }
};

Refs.prototype.ensureBound = function(target, property) {
  if (!hasOwnProperty(target, property)) {
    this.bind(target, property);
  }
};

Refs.prototype.unset = function(target, property, value) {

  if (target) {
    this.ensureBound(target, property);

    if (property.collection) {
      target[property.name].remove(value);
    } else {
      target[property.name] = undefined;
    }
  }
};

Refs.prototype.set = function(target, property, value) {

  if (target) {
    this.ensureBound(target, property);

    if (property.collection) {
      target[property.name].add(value);
    } else {
      target[property.name] = value;
    }
  }
};

module.exports = Refs;


/**
 * An attribute descriptor to be used specify an attribute in a {@link Refs} instance
 *
 * @typedef {Object} Refs.AttributeDescriptor
 * @property {String} name
 * @property {boolean} [collection=false]
 * @property {boolean} [enumerable=false]
 */
},{}]},{},[1])(1)
});
//# sourceMappingURL=bpmn-modeler.js.map