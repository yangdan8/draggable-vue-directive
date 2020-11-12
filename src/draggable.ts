import Vue, { DirectiveOptions, VNode } from "vue";
import { DirectiveBinding } from 'vue/types/options';

export type HandleType = Vue | HTMLElement;
export interface Position {
	left: number;
	top: number;
}

export interface PositionDiff {
	x: number;
	y: number;
}

export interface MarginOptions {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

export interface DraggableValue {
	handle?: HandleType;
	onPositionChange?: (posDiff?: PositionDiff, pos?: Position, event?: MouseEvent) => void;
	onDragEnd?: (posDiff?: PositionDiff, pos?: Position, event?: MouseEvent) => void;
	onDragStart?: (posDiff?: PositionDiff, pos?: Position, event?: MouseEvent) => void;
	resetInitialPos?: boolean;
	stopDragging?: boolean;
	boundingRect?: ClientRect;
	boundingElement?: HTMLElement;
	boundingRectMargin?: MarginOptions;
	initialPosition?: Position;
}

export interface DraggableBindings extends DirectiveBinding {
	value: DraggableValue;
}

export interface DraggableState {
	initialPosition: Position;
	startDragPosition: Position;
	currentDragPosition: Position;
	initialMousePos?: Position;
}

enum ChangePositionType {
	Start = 1,
	End,
	Move
}

function extractHandle(handle: HandleType): HTMLElement {
	return handle && ((handle as Vue).$el || handle) as HTMLElement;
}

function getPosWithBoundaries(elementRect: ClientRect, boundingRect: ClientRect, left: number, top: number, boundingRectMargin: MarginOptions = {}): Position {
	const adjustedPos: Position = { left, top };
	const { height, width } = elementRect;
	const topRect = top,
		bottomRect = top + height,
		leftRect = left,
		rightRect = left + width;
	const marginTop = boundingRectMargin.top || 0,
		marginBottom = boundingRectMargin.bottom || 0,
		marginLeft = boundingRectMargin.left || 0,
		marginRight = boundingRectMargin.right || 0;
	const topBoundary = boundingRect.top + marginTop,
		bottomBoundary = boundingRect.bottom - marginBottom,
		leftBoundary = boundingRect.left + marginLeft,
		rightBoundary = boundingRect.right - marginRight;
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

export const Draggable: DirectiveOptions = {
	bind(el: HTMLElement, binding: DirectiveBinding, vnode: VNode, oldVnode: VNode) {
		const binding2=  binding as DraggableBindings;
		Draggable.update!(el, binding2, vnode, oldVnode);
	},
	update(el: HTMLElement, binding: DirectiveBinding, vnode: VNode, oldVnode: VNode) {
		const binding2=  binding as DraggableBindings;
		if (binding2.value && binding2.value.stopDragging) {
			return;
		}
		const handler = (binding2.value && binding2.value.handle && extractHandle(binding2.value.handle)) || el;
		if (binding2 && binding2.value && binding2.value.resetInitialPos) {
			initializeState();
			handlePositionChanged();
		}
		if (!handler.getAttribute("draggable")) {
			el.removeEventListener("mousedown", (el as any)["listener"]);
			handler.addEventListener("mousedown", mouseDown);
			handler.setAttribute("draggable", "true");
			(el as any)["listener"] = mouseDown;
			initializeState();
			handlePositionChanged();
		}

		function mouseMove(event: MouseEvent) {
			event.preventDefault();

			const stopDragging = binding2.value && binding2.value.stopDragging;
			if (stopDragging) {
				return;
			}
			
			let state = getState();
			if (!state.startDragPosition || !state.initialMousePos) {
				initializeState(event);
				state = getState();
			}

			let dx = event.clientX - state.initialMousePos!.left;
			let dy = event.clientY - state.initialMousePos!.top;

			let currentDragPosition = {
				left: state.startDragPosition.left + dx,
				top: state.startDragPosition.top + dy
			};

			const boundingRect = getBoundingRect();
			const elementRect = el.getBoundingClientRect();

			if (boundingRect && elementRect) {
				currentDragPosition = getPosWithBoundaries(
					elementRect,
					boundingRect,
					currentDragPosition.left,
					currentDragPosition.top,
					binding2.value.boundingRectMargin
				);
			}

			setState({ currentDragPosition });
			updateElementStyle();
			handlePositionChanged(event);
		}

		function getBoundingRect(): ClientRect | undefined {
			if (!binding2.value) {
				return;
			}

			return binding2.value.boundingRect
				|| binding2.value.boundingElement
				&& binding2.value.boundingElement.getBoundingClientRect();
		}

		function updateElementStyle(): void {
			const state = getState();
			if (!state.currentDragPosition) {
				return;
			}

			el.style.position = "fixed";
			el.style.left = `${state.currentDragPosition.left}px`;
			el.style.top = `${state.currentDragPosition.top}px`;
		}

		function mouseUp(event: MouseEvent) {
			event.preventDefault();

			const currentRectPosition = getRectPosition();
			setState({
				initialMousePos: undefined,
				startDragPosition: currentRectPosition,
				currentDragPosition: currentRectPosition
			});

			document.removeEventListener("mousemove", mouseMove);
			document.removeEventListener("mouseup", mouseUp);
			handlePositionChanged(event, ChangePositionType.End);
		}

		function mouseDown(event: MouseEvent) {
			setState({ initialMousePos: getInitialMousePosition(event) });
			handlePositionChanged(event, ChangePositionType.Start);
			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("mouseup", mouseUp);
		}

		function getInitialMousePosition(event?: MouseEvent): Position | undefined {
			return event && {
				left: event.clientX,
				top: event.clientY
			};
		}

		function getRectPosition(): Position | undefined {
			const clientRect = el.getBoundingClientRect();
			if (!clientRect.height || !clientRect.width) {
				return;
			}
			return { left: clientRect.left, top: clientRect.top };
		}

		function initializeState(event?: MouseEvent): void {
			const state = getState();
			const initialRectPositionFromBinding = binding2 && binding2.value && binding2.value.initialPosition;
			const initialRectPositionFromState = state.initialPosition;
			const startingDragPosition = getRectPosition();
			const initialPosition = initialRectPositionFromBinding || initialRectPositionFromState || startingDragPosition;

			setState({
				initialPosition: initialPosition,
				startDragPosition: initialPosition,
				currentDragPosition: initialPosition,
				initialMousePos: getInitialMousePosition(event)
			});
			updateElementStyle();
		}

		function setState(partialState: Partial<DraggableState>) {
			const prevState = getState();
			const state = {
				...prevState,
				...partialState
			};
			handler.setAttribute("draggable-state", JSON.stringify(state));
		}

		function handlePositionChanged(event?: MouseEvent, changePositionType?: ChangePositionType) {

			const state = getState();
			const posDiff: PositionDiff = { x: 0, y: 0 };
			if (state.currentDragPosition && state.startDragPosition) {
				posDiff.x = state.currentDragPosition.left - state.startDragPosition.left;
				posDiff.y = state.currentDragPosition.top - state.startDragPosition.top;
			}
			const currentPosition = state.currentDragPosition && { ...state.currentDragPosition };

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

		function getState(): DraggableState {
			return JSON.parse(handler.getAttribute("draggable-state") as string) || {};
		}
	}
};