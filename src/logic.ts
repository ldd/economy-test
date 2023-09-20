const TICK_PRODUCED = 10;
const CLERK_SALARY = 150;

const uuid = () => `${Math.random()}`;

export type ProducedResourceType = "food" | "water" | "wood";
export type ResourceType = ProducedResourceType | "money";
export type Resource = {
  type: ResourceType;
  quantity: number;
};
export type Worker = {
  id: string;
  alive: boolean;
  type: ResourceType;
  resources: Record<ResourceType, number>;
};

export type TaxCenterType = Extract<ResourceType, "money"> | "tax_rate";
export type LabelType = ResourceType | TaxCenterType;
export type TaxCentre = {
  id: string;
  type: "money";
  resources: Record<TaxCenterType, number>;
};
export type Actor = Worker | TaxCentre;
export function isWorker(actor: Actor): actor is Worker {
  return !("tax_rate" in actor.resources);
}

export function buildWorker(type: ResourceType): Worker {
  const resources = { money: 50, food: 3, water: 3, wood: 3 };
  return { id: uuid(), alive: true, type, resources };
}

export function buildTaxCentre(money = 50, tax_rate = 0.2): TaxCentre {
  return { id: uuid(), type: "money", resources: { money, tax_rate } };
}

type PotentialTrade = { id: string; type: ResourceType };

const consumableBlackList: Partial<Record<ResourceType, boolean>> = {
  money: true,
};

export type MarketPlace = {
  sells: (PotentialTrade | null)[];
  prices: Record<ProducedResourceType, number>;
};

// QOL
function qol(worker: Worker) {
  return Math.max(
    Math.min(
      ...Object.entries(worker.resources)
        .filter(([someType]) => !consumableBlackList[someType as ResourceType])
        .map(([, quantity]) => quantity)
    ),
    0
  );
}

function keepsQol(resources: Worker["resources"], type: ResourceType) {
  return Object.entries(resources)
    .filter(([someType]) => someType !== type)
    .filter(([someType]) => !consumableBlackList[someType as ResourceType])
    .some(([, quantity]) => quantity < resources[type]);
}

export function getGlobalQOL(workers: Worker[]) {
  const total = workers.reduce((total, worker) => total + qol(worker), 0);
  return Math.round((total / workers.length) * 100) / 100;
}

function calculateConsumed(oldQuantity: number) {
  return Math.max(1, Math.floor(oldQuantity / 3));
}

// exit early for non-consumed resources (such as money)
function getConsumableResources(worker: Worker): [ResourceType, number][] {
  return (Object.entries(worker.resources) as [ResourceType, number][]).filter(
    ([type]) => !consumableBlackList[type]
  );
}

function useResources(workers: Worker[]) {
  // produce or consume resources
  workers.forEach((worker) => {
    getConsumableResources(worker).forEach(([type, oldQuantity]) => {
      // either produce and increase quantity of resource, or consume it
      const isProducer = type === worker.type;
      const quantity = isProducer
        ? TICK_PRODUCED
        : -calculateConsumed(oldQuantity);
      worker.resources[type] += quantity;
      if (worker.resources[type] <= 0) worker.alive = false;
      // min for a resource is 0
      worker.resources[type] = Math.max(0, worker.resources[type]);
    });
  });
}

const calculateTax = (taxResources: TaxCentre["resources"], cost: number) =>
  Math.max(1, Math.floor(taxResources.tax_rate * cost));

function distributeTax(workers: Worker[], taxCentre: TaxCentre) {
  // tax centre refills clerks pockets
  const taxResources = taxCentre.resources;
  workers
    .filter((worker) => worker.type === "money")
    .forEach((worker) => {
      const refill = CLERK_SALARY - worker.resources.money;
      if (refill <= 0 || taxResources.money < refill) return;
      worker.resources.money += refill;
      taxResources.money -= refill;
    });
}

const printMoney = (taxCentre: TaxCentre) => (taxCentre.resources.money = 1000);

function transact(
  buyer: Worker,
  seller: Worker,
  taxCentre: TaxCentre,
  trade: PotentialTrade,
  prices: MarketPlace["prices"]
) {
  const { type: sellType } = trade;

  if (sellType === "money") return;

  const { resources: buyerResources } = buyer;
  const { resources: sellerResources } = seller;
  buyerResources[sellType] += 1;
  sellerResources[sellType] -= 1;
  if (sellerResources[sellType] <= 0) seller.alive = false;

  // apply tax
  const cost = prices[sellType];
  buyerResources.money -= cost;
  const { resources: taxResources } = taxCentre;
  const tax = calculateTax(taxResources, cost);
  sellerResources.money += cost - tax;
  taxResources.money += tax;
}

type SellRecord = Partial<Record<ResourceType, boolean>>;
function adjustPrices(prices: MarketPlace["prices"], dic: SellRecord) {
  // for each resource, change its price if necessary
  Object.entries(prices).forEach((tuple) => {
    const [type, price] = tuple as [ProducedResourceType, number];
    if (dic[type] === undefined) return;
    const newPrice = dic[type]
      ? Math.floor(price * 0.95)
      : Math.ceil(price * 1.05);
    prices[type] = Math.max(1, newPrice);
  });
}

function sellAll(
  workers: Worker[],
  taxCentre: TaxCentre,
  marketplace: MarketPlace
) {
  const { sells, prices } = marketplace;

  // setup sellers
  workers.forEach((worker) => {
    getConsumableResources(worker).forEach(([type, quantity]) => {
      // producers that would keep their qol attempt to sell resources
      const isProducer = type === worker.type;
      const shouldSell = quantity > 0 && keepsQol(worker.resources, type);
      if (isProducer && shouldSell) sells.push({ id: worker.id, type });
    });
  });

  const workerDic = Object.fromEntries(
    workers.map((worker) => [worker.id, worker])
  );
  const decreaseDic: SellRecord = {};

  sells.sort(Math.random);

  let sellIndex = 0;
  while (sells[sellIndex]) {
    const sell = sells[sellIndex];
    if (!sell) return null;

    const { id: sellerId, type: sellType } = sell;
    const { resources: sellerResources, alive: sellerAlive } =
      workerDic[sellerId];

    if (sellType === "money") return null;

    decreaseDic[sellType] ||= false;

    let buyer: undefined | Worker;
    if (!sellerAlive) buyer = undefined;
    else
      buyer = workers
        .filter((worker) => !keepsQol(worker.resources, sellType))
        .filter((worker) => worker.id !== sellerId && worker.alive)
        .sort(Math.random)
        .find((worker) => worker.resources.money >= prices[sellType]);

    if (buyer) transact(buyer, workerDic[sellerId], taxCentre, sell, prices);

    // remove seller if the seller would change its QoL by selling
    if (!sellerAlive || !keepsQol(sellerResources, sellType))
      sells[sellIndex] = null;

    // go to next seller when there are no buyers left
    if (!buyer) sellIndex = (sellIndex + 1) % sells.length;
  }
  return decreaseDic;
}

export function applyRules(
  workers: Worker[],
  taxCentre: TaxCentre,
  marketplace: MarketPlace
) {
  useResources(workers);

  distributeTax(workers, taxCentre);
  printMoney(taxCentre);

  marketplace.sells = [];
  const tradeResult = sellAll(workers, taxCentre, marketplace);
  if (tradeResult) adjustPrices(marketplace.prices, tradeResult);
}
