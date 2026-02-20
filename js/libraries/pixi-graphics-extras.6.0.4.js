var Polygon=PIXI.Polygon,Graphics=PIXI.Graphics,PI_2=PIXI.PI_2; // #CUSTOM [14/05/21]
/*!
 * @pixi/graphics-extras - v6.0.4
 * Compiled Tue, 11 May 2021 18:00:23 UTC
 *
 * @pixi/graphics-extras is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
function drawTorus(x, y, innerRadius, outerRadius, startArc, endArc) {
  if (startArc === void 0) {
    startArc = 0;
  }
  if (endArc === void 0) {
    endArc = Math.PI * 2;
  }
  if (Math.abs(endArc - startArc) >= Math.PI * 2) {
    return this.drawCircle(x, y, outerRadius).beginHole().drawCircle(x, y, innerRadius).endHole();
  }
  this.finishPoly();
  this.arc(x, y, innerRadius, endArc, startArc, true).arc(x, y, outerRadius, startArc, endArc, false).finishPoly();
  return this;
}
function drawChamferRect(x, y, width, height, chamfer) {
  if (chamfer <= 0) {
    return this.drawRect(x, y, width, height);
  }
  var inset = Math.min(chamfer, Math.min(width, height) / 2);
  var right = x + width;
  var bottom = y + height;
  var points = [
    x + inset,
    y,
    right - inset,
    y,
    right,
    y + inset,
    right,
    bottom - inset,
    right - inset,
    bottom,
    x + inset,
    bottom,
    x,
    bottom - inset,
    x,
    y + inset
  ];
  for (var i = points.length - 1; i >= 2; i -= 2) {
    if (points[i] === points[i - 2] && points[i - 1] === points[i - 3]) {
      points.splice(i - 1, 2);
    }
  }
  return this.drawPolygon(points);
}
function drawFilletRect(x, y, width, height, fillet) {
  if (fillet === 0) {
    return this.drawRect(x, y, width, height);
  }
  var maxFillet = Math.min(width, height) / 2;
  var inset = Math.min(maxFillet, Math.max(-maxFillet, fillet));
  var right = x + width;
  var bottom = y + height;
  var dir = inset < 0 ? -inset : 0;
  var size = Math.abs(inset);
  return this.moveTo(x, y + size).arcTo(x + dir, y + dir, x + size, y, size).lineTo(right - size, y).arcTo(right - dir, y + dir, right, y + size, size).lineTo(right, bottom - size).arcTo(right - dir, bottom - dir, x + width - size, bottom, size).lineTo(x + size, bottom).arcTo(x + dir, bottom - dir, x, bottom - size, size).closePath();
}
function drawRegularPolygon(x, y, radius, sides, rotation) {
  if (rotation === void 0) {
    rotation = 0;
  }
  sides = Math.max(sides | 0, 3);
  var startAngle = -1 * Math.PI / 2 + rotation;
  var delta = Math.PI * 2 / sides;
  var polygon = [];
  for (var i = 0; i < sides; i++) {
    var angle = i * delta + startAngle;
    polygon.push(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  }
  return this.drawPolygon(polygon);
}
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) {
      if (b2.hasOwnProperty(p)) {
        d2[p] = b2[p];
      }
    }
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var Star = function(_super) {
  __extends(Star2, _super);
  function Star2(x, y, points, radius, innerRadius, rotation) {
    if (rotation === void 0) {
      rotation = 0;
    }
    var _this = this;
    innerRadius = innerRadius || radius / 2;
    var startAngle = -1 * Math.PI / 2 + rotation;
    var len = points * 2;
    var delta = PI_2 / len;
    var polygon = [];
    for (var i = 0; i < len; i++) {
      var r = i % 2 ? innerRadius : radius;
      var angle = i * delta + startAngle;
      polygon.push(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }
    _this = _super.call(this, polygon) || this;
    return _this;
  }
  return Star2;
}(Polygon);
function drawStar(x, y, points, radius, innerRadius, rotation) {
  if (rotation === void 0) {
    rotation = 0;
  }
  return this.drawPolygon(new Star(x, y, points, radius, innerRadius, rotation));
}
Object.defineProperties(Graphics.prototype, {
  drawTorus: {value: drawTorus},
  drawChamferRect: {value: drawChamferRect},
  drawFilletRect: {value: drawFilletRect},
  drawRegularPolygon: {value: drawRegularPolygon},
  drawStar: {value: drawStar}
});
