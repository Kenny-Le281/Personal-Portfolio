import { useCallback, useEffect, useRef, useState } from 'react';
import type { Rect } from '../data/layout';

export interface View {
  x: number;
  y: number;
  k: number;
}

const MIN_K = 0.3;
const MAX_K = 2.5;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

/**
 * Pan/zoom for an SVG "world" rendered inside a container element.
 * The world is drawn in a <g> with `translate(x,y) scale(k)`.
 */
export function usePanZoom(world: { w: number; h: number }, padding = { top: 24, right: 24, bottom: 24, left: 24 }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [animating, setAnimating] = useState(false);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; k: number; cx: number; cy: number; vx: number; vy: number } | null>(null);
  const animTimer = useRef<number>();

  const animate = useCallback((next: View) => {
    window.clearTimeout(animTimer.current);
    setAnimating(true);
    setView(next);
    animTimer.current = window.setTimeout(() => setAnimating(false), 650);
  }, []);

  const fitRect = useCallback(
    (r: Rect, smooth = true, maxK = MAX_K) => {
      const el = ref.current;
      if (!el) return;
      const cw = el.clientWidth - padding.left - padding.right;
      const ch = el.clientHeight - padding.top - padding.bottom;
      const k = clampK(Math.min(cw / r.w, ch / r.h, maxK));
      const next = {
        k,
        x: padding.left + (cw - r.w * k) / 2 - r.x * k,
        y: padding.top + (ch - r.h * k) / 2 - r.y * k,
      };
      if (smooth) animate(next);
      else setView(next);
    },
    [animate, padding.left, padding.right, padding.top, padding.bottom],
  );

  const fit = useCallback((smooth = true) => fitRect({ x: 0, y: 0, ...world }, smooth, 1.15), [fitRect, world]);

  // Fit on mount and on resize.
  useEffect(() => {
    fit(false);
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => fit(false));
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const k = clampK(v.k * factor);
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const el = ref.current;
      if (!el) return;
      setAnimating(true);
      zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2);
      window.clearTimeout(animTimer.current);
      animTimer.current = window.setTimeout(() => setAnimating(false), 300);
    },
    [zoomAt],
  );

  // Wheel needs a non-passive listener to preventDefault.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX) * 0.5) {
        zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - rect.left, e.clientY - rect.top);
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = ref.current!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimating(false);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = el.getBoundingClientRect();
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        k: view.k,
        cx: (a.x + b.x) / 2 - rect.left,
        cy: (a.y + b.y) / 2 - rect.top,
        vx: view.x,
        vy: view.y,
      };
      drag.current = null;
    } else {
      drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const p = pinch.current;
      const k = clampK(p.k * (Math.hypot(a.x - b.x, a.y - b.y) / p.dist));
      const f = k / p.k;
      setView({ k, x: p.cx - (p.cx - p.vx) * f, y: p.cy - (p.cy - p.vy) * f });
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) > 4) {
      d.moved = true;
      ref.current?.setPointerCapture(e.pointerId);
    }
    if (d.moved) setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      // Leave `drag` set until after the click event so clicks after a drag are ignored.
      window.setTimeout(() => (drag.current = null), 0);
    }
  };

  /** True when the last pointer interaction was a drag (so a click should be ignored). */
  const wasDrag = () => !!drag.current?.moved;

  return {
    ref,
    view,
    animating,
    fit,
    fitRect,
    zoomBy,
    wasDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
