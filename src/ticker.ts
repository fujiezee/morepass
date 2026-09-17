type Listener = (time: number, delta: number) => void;

let started = false;
let last = 0;
let rafId = 0;
const listeners = new Set<Listener>();

function tick(now: number) {
  if (!started) return;
  const time = now / 1000;
  const delta = last === 0 ? 0 : Math.min(time - last, 0.064);
  last = time;
  for (const listener of listeners) listener(time, delta);
  rafId = requestAnimationFrame(tick);
}

function start() {
  if (started) return;
  started = true;
  last = 0;
  rafId = requestAnimationFrame(tick);
}

function stop() {
  if (!started) return;
  started = false;
  cancelAnimationFrame(rafId);
  rafId = 0;
  last = 0;
}

export const ticker = {
  add(listener: Listener) {
    listeners.add(listener);
    start();
    return () => ticker.remove(listener);
  },
  remove(listener: Listener) {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  },
  /** Test helper: drive the ticker with a fixed timestamp (seconds). */
  _set(time: number) {
    for (const listener of listeners) listener(time, 0);
  },
  _reset() {
    listeners.clear();
    stop();
  },
};
