export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 70;

export function axisToCanvas(automation, criticality, w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
  return {
    x: automation * (w - NODE_WIDTH),
    y: (1 - criticality) * (h - NODE_HEIGHT),
  };
}

export function canvasToAxis(x, y, w = CANVAS_WIDTH, h = CANVAS_HEIGHT) {
  return {
    automation: Math.max(0, Math.min(1, x / (w - NODE_WIDTH))),
    criticality: Math.max(0, Math.min(1, 1 - y / (h - NODE_HEIGHT))),
  };
}
