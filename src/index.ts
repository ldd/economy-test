import { show } from "./display";
import type { Worker } from "./logic";
import { applyRules, buildTaxCentre, buildWorker } from "./logic";

const INTERVAL = 1000;

function loop() {
  let time = 0;
  const workers: Worker[] = [];

  workers.push(buildWorker("food"));
  workers.push(buildWorker("water"));
  workers.push(buildWorker("wood"));

  workers.push(buildWorker("money"));
  workers.push(buildWorker("money"));
  workers.push(buildWorker("money"));

  const taxCentre = buildTaxCentre(1000, 0.1);
  const actors = [...workers, taxCentre];

  show(time, actors);
  setInterval(() => {
    time += 1;
    applyRules(workers, taxCentre);
    show(time, actors);
  }, INTERVAL);
}

document.addEventListener("DOMContentLoaded", loop);
