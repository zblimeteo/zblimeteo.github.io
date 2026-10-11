'use client';

import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';

const initialView = { scale: 1, x: 0, y: 0 };
function bounded(scale: number, x: number, y: number) {
  return { scale, x: Math.min(0, Math.max(960 * (1 - scale), x)), y: Math.min(0, Math.max(480 * (1 - scale), y)) };
}

/** Wheel interception is scoped to a focused map; the page scrolls everywhere else. */
export default function MapFrame({ label, children }: { label: string; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const selected = useRef(false);
  const [active, setActive] = useState(false);
  const [view, setView] = useState(initialView);
  const drag = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function zoom(factor: number, x = 480, y = 240) {
    setView(current => {
      const scale = Math.max(1, Math.min(5, current.scale * factor));
      if (scale === 1) return initialView;
      const ratio = scale / current.scale;
      return bounded(scale, x - (x - current.x) * ratio, y - (y - current.y) * ratio);
    });
  }

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    function wheel(event: WheelEvent) {
      if (!selected.current || event.ctrlKey) return;
      event.preventDefault();
      const rect = element!.getBoundingClientRect();
      zoom(event.deltaY < 0 ? 1.22 : 1 / 1.22, (event.clientX - rect.left) / rect.width * 960, (event.clientY - rect.top) / rect.height * 480);
    }
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);

  function stop() { drag.current = null; setDragging(false); }
  function pointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'touch' && !selected.current) return;
    if (event.button !== 0) return;
    frame.current?.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: view.x, originY: view.y };
    setDragging(true);
  }

  return <div ref={frame} className={`map-frame${active ? ' is-selected' : ''}`} tabIndex={0} role="group" aria-label={`${label}. Click to enable zoom; press Escape to return to page scrolling.`}
    onFocus={() => { selected.current = true; setActive(true); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { selected.current = false; setActive(false); stop(); } }}
    onKeyDown={event => {
      if (event.key === 'Escape') { selected.current = false; setActive(false); stop(); (document.activeElement as HTMLElement)?.blur(); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.35); }
      if (event.key === '-') { event.preventDefault(); zoom(1 / 1.35); }
    }}>
    <div className="map-controls" aria-label={`${label} controls`}>
      <button type="button" onClick={() => zoom(1.35)} aria-label={`Zoom in ${label}`}>+</button>
      <button type="button" onClick={() => zoom(1 / 1.35)} aria-label={`Zoom out ${label}`}>−</button>
      <button type="button" className="map-reset" onClick={() => setView(initialView)}>Reset</button>
    </div>
    <svg ref={svg} className={dragging ? 'is-dragging' : ''} viewBox="0 0 960 480" role="img" aria-label={label}
      onPointerDown={pointerDown}
      onPointerMove={event => {
        if (!drag.current || drag.current.id !== event.pointerId || view.scale === 1) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setView(bounded(view.scale, drag.current.originX + (event.clientX - drag.current.x) / rect.width * 960, drag.current.originY + (event.clientY - drag.current.y) / rect.height * 480));
      }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      <g data-map-view="true" transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>{children}</g>
    </svg>
    <p className="map-hint">{active ? 'Scroll to zoom · Drag to move · Esc to exit' : 'Click map to zoom · Scroll to browse the page'}</p>
  </div>;
}
