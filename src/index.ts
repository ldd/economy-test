import { Market } from "./Market";
import { TaxCentre } from "./TaxCentre";
import { Worker } from "./Worker";
import { show } from "./display";

const INTERVAL = 0.5 * 1000;

function createWorkers() {
  const workers: Worker[] = [];

  workers.push(new Worker("food"));
  workers.push(new Worker("water"));
  workers.push(new Worker("wood"));

  workers.push(new Worker("money"));
  workers.push(new Worker("money"));
  workers.push(new Worker("money"));
  return workers;
}

function applyRules(workers: Worker[], taxCentre: TaxCentre, market: Market) {
  workers.forEach((worker) => worker.useResources());

  taxCentre.distributeTax(workers);
  taxCentre.printMoney();

  market.setupMarketplace(workers);
  const tradeResult = market.sellAll(workers, taxCentre);
  if (tradeResult) market.adjustPrices(tradeResult);
}
function loop() {
  let time = 0;

  const workers = createWorkers();
  const taxCentre = new TaxCentre(1000, 0.1);
  const actors = [...workers, taxCentre];

  const market = new Market();
  show(time, actors, market);
  setInterval(() => {
    time += 1;
    applyRules(workers, taxCentre, market);
    show(time, actors, market);
  }, INTERVAL);
}

document.addEventListener("DOMContentLoaded", loop);
