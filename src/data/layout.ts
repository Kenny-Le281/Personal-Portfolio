import { pods, skills, categoryLabels, type SkillCategory } from './resume';

// World coordinates for the cluster map (SVG user units).
// OY shifts everything below the identity header (node/kenny-le).
const OY = 150;
export const WORLD = { w: 1200, h: 830 + OY };
export const headerRect = { x: 30, y: 30, w: 1140, h: 124 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const POD = { w: 214, h: 124 };

export const namespaces: { id: string; label: string; rect: Rect }[] = [
  { id: 'experience', label: 'ns/experience', rect: { x: 30, y: 30 + OY, w: 720, h: 380 } },
  { id: 'projects', label: 'ns/projects', rect: { x: 780, y: 30 + OY, w: 390, h: 180 } },
  { id: 'education', label: 'ns/education', rect: { x: 780, y: 230 + OY, w: 390, h: 180 } },
  { id: 'skills', label: 'ns/skills', rect: { x: 30, y: 440 + OY, w: 1140, h: 360 } },
];

// Experience pods sit chronologically left→right so the timeline below reads naturally.
const podPositions: Record<string, { x: number; y: number }> = {
  'zagora-data': { x: 55, y: 84 + OY },
  'jsi-devtools': { x: 283, y: 84 + OY },
  'jsi-platform': { x: 511, y: 84 + OY },
  nexthomeai: { x: 868, y: 70 + OY },
  uottawa: { x: 868, y: 270 + OY },
};

export const podRects: Record<string, Rect> = Object.fromEntries(
  pods.map((p) => [p.id, { ...podPositions[p.id], ...POD }]),
);

// Simple flow layout for skill chips, one block per category.
const CHIP_H = 34;
const charW = 8.2;
export const skillRects: Record<string, Rect> = {};
export const categoryHeaders: { label: string; x: number; y: number }[] = [];

(() => {
  const ns = namespaces.find((n) => n.id === 'skills')!.rect;
  const left = ns.x + 210;
  const right = ns.x + ns.w - 24;
  let y = ns.y + 64;
  (Object.keys(categoryLabels) as SkillCategory[]).forEach((cat) => {
    categoryHeaders.push({ label: categoryLabels[cat], x: ns.x + 24, y: y + 22 });
    let x = left;
    skills
      .filter((s) => s.category === cat)
      .forEach((s) => {
        const w = Math.round(s.label.length * charW + 34);
        if (x + w > right) {
          x = left;
          y += CHIP_H + 14;
        }
        skillRects[s.id] = { x, y, w, h: CHIP_H };
        x += w + 12;
      });
    y += CHIP_H + 42;
  });
})();

export const timelineY = 300 + OY;
