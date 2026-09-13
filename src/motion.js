export function animateSurface(root, { enabled = true, reduced = false } = {}) {
  if (!enabled || reduced || !root.animate) return;
  root.querySelectorAll(".orbit-progress,.ring-fill").forEach((circle) => {
    const target = getComputedStyle(circle).strokeDashoffset;
    const length = 2 * Math.PI * Number(circle.getAttribute("r"));
    circle.animate(
      [{ strokeDashoffset: String(length) }, { strokeDashoffset: target }],
      { duration: 620, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  });
  root
    .querySelectorAll(".mini-progress > span,.project-progress-track > span")
    .forEach((bar) => {
      bar.animate([{ transform: "scaleX(.05)" }, { transform: "scaleX(1)" }], {
        duration: 360,
        easing: "cubic-bezier(.22,1,.36,1)",
      });
    });
  [
    ...root.querySelectorAll(
      ".kanban-column,.tool-featured,.project-workspace-heading",
    ),
  ]
    .slice(0, 4)
    .forEach((el, i) => {
      el.animate(
        [
          { opacity: 0.65, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 210, delay: i * 25, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    });
}
