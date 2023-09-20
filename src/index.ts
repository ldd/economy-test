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

const deflate = <T extends string>(resource: Record<T, number>, type: T) => {
  resource[type] = Math.floor(resource[type] / 10);
};

function remintCoin(workers: Worker[], taxCentre: TaxCentre, market: Market) {
  const aliveWorkers = workers.filter((worker) => worker.alive);
  let wallet = aliveWorkers.reduce(
    (total, worker) => (total += worker.resources.money),
    0
  );
  const LIMIT = 100_000;
  if (wallet / aliveWorkers.length < LIMIT) return;
  aliveWorkers.forEach((worker) => deflate(worker.resources, "money"));
  deflate(taxCentre.resources, "money");
  Object.keys(market.prices).forEach((priceType) => {
    deflate(market.prices, priceType as keyof Market["prices"]);
  });
}

function applyRules(workers: Worker[], taxCentre: TaxCentre, market: Market) {
  workers.forEach((worker) => worker.useResources());

  remintCoin(workers, taxCentre, market);
  taxCentre.distributeTax(workers, market.totalPrice(4));
  taxCentre.printMoney(market.totalPrice(33));

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
