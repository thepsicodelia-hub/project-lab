const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Reveal only when content enters the viewport; content remains visible without JS. */
export function bindPolishMotion(root) {
  if (!root) return () => {};
  const targets = [
    ...root.querySelectorAll(
      ".studio-kpi, .studio-mission, .studio-agenda, .studio-production, .studio-projects, .studio-tasks, .panel, .stat, .tool-card, .settings-section, .ops-metrics, .ops-equipment, .project-card",
    ),
  ];
  const unique = [...new Set(targets)];
  root.classList.add("polish-motion-ready");
  unique.forEach((element, index) => {
    element.classList.add("polish-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 28}ms`);
  });
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    unique.forEach((element) => element.classList.add("is-visible"));
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );
  unique.forEach((element) => observer.observe(element));

  const tiltTargets = unique.filter((element) =>
    element.matches(".studio-kpi, .studio-project-card, .tool-card"),
  );
  const cleanups = [];
  if (!reducedMotion() && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
    tiltTargets.forEach((element) => {
      element.classList.add("apple-tilt");
      const move = (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.setProperty("--tilt-x", `${(y * -3.2).toFixed(2)}deg`);
        element.style.setProperty("--tilt-y", `${(x * 3.2).toFixed(2)}deg`);
        element.style.setProperty("--tilt-lift", "-3px");
      };
      const leave = () => {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
        element.style.setProperty("--tilt-lift", "0px");
      };
      element.addEventListener("pointermove", move, { passive: true });
      element.addEventListener("pointerleave", leave, { passive: true });
      cleanups.push(() => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerleave", leave);
      });
    });
  }
  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
  };
}

export function installScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return () => {};
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  update();
  return () => {
    window.removeEventListener("scroll", onScroll);
    if (frame) cancelAnimationFrame(frame);
  };
}

export { EASE };
