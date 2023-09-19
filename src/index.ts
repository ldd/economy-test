import { show } from "./display";
import type { MarketPlace, Worker } from "./logic";
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

  const prices = { food: 10, water: 10, wood: 10 };
  const marketplace: MarketPlace = { sells: [], prices };

  show(time, actors, marketplace);
  setInterval(() => {
    time += 1;
    applyRules(workers, taxCentre, marketplace);
    show(time, actors, marketplace);
  }, INTERVAL);
}

document.addEventListener("DOMContentLoaded", loop);
