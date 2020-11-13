(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.DraggableVueDirective = {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var ChangePositionType;
    (function (ChangePositionType) {
        ChangePositionType[ChangePositionType["Start"] = 1] = "Start";
        ChangePositionType[ChangePositionType["End"] = 2] = "End";
        ChangePositionType[ChangePositionType["Move"] = 3] = "Move";
    })(ChangePositionType || (ChangePositionType = {}));
    function extractHandle(handle) {
        return handle && (handle.$el || handle);
    }
    function getPosWithBoundaries(elementRect, boundingRect, left, top, boundingRectMargin) {
        if (boundingRectMargin === void 0) { boundingRectMargin = {}; }
        var adjustedPos = { left: left, top: top };
        var height = elementRect.height, width = elementRect.width;
        var topRect = top, bottomRect = top + height, leftRect = left, rightRect = left + width;
        var marginTop = boundingRectMargin.top || 0, marginBottom = boundingRectMargin.bottom || 0, marginLeft = boundingRectMargin.left || 0, marginRight = boundingRectMargin.right || 0;
        var topBoundary = boundingRect.top + marginTop, bottomBoundary = boundingRect.bottom - marginBottom, leftBoundary = boundingRect.left + marginLeft, rightBoundary = boundingRect.right - marginRight;
        if (topRect < topBoundary) {
            adjustedPos.top = topBoundary;
        }
        else if (bottomRect > bottomBoundary) {
            adjustedPos.top = bottomBoundary - height;
        }
        if (leftRect < leftBoundary) {
            adjustedPos.left = leftBoundary;
        }
        else if (rightRect > rightBoundary) {
            adjustedPos.left = rightBoundary - width;
        }
        return adjustedPos;
    }
    var Draggable = {
        bind: function (el, binding, vnode, oldVnode) {
            var binding2 = binding;
            Draggable.update(el, binding2, vnode, oldVnode);
        },
        update: function (el, binding, vnode, oldVnode) {
            var binding2 = binding;
            if (binding2.value && binding2.value.stopDragging) {
                return;
            }
            var handler = (binding2.value && binding2.value.handle && extractHandle(binding2.value.handle)) || el;
            if (binding2 && binding2.value && binding2.value.resetInitialPos) {
                initializeState();
                handlePositionChanged();
            }
            if (!handler.getAttribute("draggable")) {
                el.removeEventListener("mousedown", el["listener"]);
                handler.addEventListener("mousedown", mouseDown);
                handler.setAttribute("draggable", "true");
                el["listener"] = mouseDown;
                initializeState();
                handlePositionChanged();
            }
            function mouseMove(event) {
                event.preventDefault();
                var stopDragging = binding2.value && binding2.value.stopDragging;
                if (stopDragging) {
                    return;
                }
                var state = getState();
                if (!state.startDragPosition || !state.initialMousePos) {
                    initializeState(event);
                    state = getState();
                }
                var dx = event.clientX - state.initialMousePos.left;
                var dy = event.clientY - state.initialMousePos.top;
                var currentDragPosition = {
                    left: state.startDragPosition.left + dx,
                    top: state.startDragPosition.top + dy
                };
                var boundingRect = getBoundingRect();
                var elementRect = el.getBoundingClientRect();
                if (boundingRect && elementRect) {
                    currentDragPosition = getPosWithBoundaries(elementRect, boundingRect, currentDragPosition.left, currentDragPosition.top, binding2.value.boundingRectMargin);
                }
                setState({ currentDragPosition: currentDragPosition });
                updateElementStyle();
                handlePositionChanged(event);
            }
            function getBoundingRect() {
                if (!binding2.value) {
                    return;
                }
                return binding2.value.boundingRect
                    || binding2.value.boundingElement
                        && binding2.value.boundingElement.getBoundingClientRect();
            }
            function updateElementStyle() {
                var state = getState();
                if (!state.currentDragPosition) {
                    return;
                }
                el.style.position = "fixed";
                el.style.left = state.currentDragPosition.left + "px";
                el.style.top = state.currentDragPosition.top + "px";
            }
            function mouseUp(event) {
                event.preventDefault();
                var currentRectPosition = getRectPosition();
                setState({
                    initialMousePos: undefined,
                    startDragPosition: currentRectPosition,
                    currentDragPosition: currentRectPosition
                });
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
                handlePositionChanged(event, ChangePositionType.End);
            }
            function mouseDown(event) {
                setState({ initialMousePos: getInitialMousePosition(event) });
                handlePositionChanged(event, ChangePositionType.Start);
                document.addEventListener("mousemove", mouseMove);
                document.addEventListener("mouseup", mouseUp);
            }
            function getInitialMousePosition(event) {
                return event && {
                    left: event.clientX,
                    top: event.clientY
                };
            }
            function getRectPosition() {
                var clientRect = el.getBoundingClientRect();
                if (!clientRect.height || !clientRect.width) {
                    return;
                }
                return { left: clientRect.left, top: clientRect.top };
            }
            function initializeState(event) {
                var state = getState();
                var initialRectPositionFromBinding = binding2 && binding2.value && binding2.value.initialPosition;
                var initialRectPositionFromState = state.initialPosition;
                var startingDragPosition = getRectPosition();
                var initialPosition = initialRectPositionFromBinding || initialRectPositionFromState || startingDragPosition;
                setState({
                    initialPosition: initialPosition,
                    startDragPosition: initialPosition,
                    currentDragPosition: initialPosition,
                    initialMousePos: getInitialMousePosition(event)
                });
                updateElementStyle();
            }
            function setState(partialState) {
                var prevState = getState();
                var state = __assign(__assign({}, prevState), partialState);
                handler.setAttribute("draggable-state", JSON.stringify(state));
            }
            function handlePositionChanged(event, changePositionType) {
                var state = getState();
                var posDiff = { x: 0, y: 0 };
                if (state.currentDragPosition && state.startDragPosition) {
                    posDiff.x = state.currentDragPosition.left - state.startDragPosition.left;
                    posDiff.y = state.currentDragPosition.top - state.startDragPosition.top;
                }
                var currentPosition = state.currentDragPosition && __assign({}, state.currentDragPosition);
                if (changePositionType === ChangePositionType.End) {
                    binding2.value && binding2.value.onDragEnd && state && binding2.value.onDragEnd(posDiff, currentPosition, event);
                }
                else if (changePositionType === ChangePositionType.Start) {
                    binding2.value && binding2.value.onDragStart && state && binding2.value.onDragStart(posDiff, currentPosition, event);
                }
                else {
                    binding2.value && binding2.value.onPositionChange && state && binding2.value.onPositionChange(posDiff, currentPosition, event);
                }
            }
            function getState() {
                return JSON.parse(handler.getAttribute("draggable-state")) || {};
            }
        }
    };

    exports.Draggable = Draggable;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=draggable-vue-directive.umd.js.map
