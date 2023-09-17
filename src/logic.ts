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
  return { id: uuid(), type, resources };
}

export function buildTaxCentre(money = 50, tax_rate = 0.2): TaxCentre {
  return { id: uuid(), type: "money", resources: { money, tax_rate } };
}

type PotentialTrade = { id: string; type: ResourceType };

const consumableBlackList: Partial<Record<ResourceType, boolean>> = {
  money: true,
};

type MarketPlace = {
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
    });
  });
}

const calculateTax = (taxResources: TaxCentre["resources"], cost: number) =>
  Math.max(1, Math.floor(taxResources.tax_rate * cost));

function transact(
  workers: Worker[],
  taxCentre: TaxCentre,
  marketplace: MarketPlace
) {
  const { sells, prices } = marketplace;

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

  // print money
  taxResources.money = 1000;

  // setup sellers
  workers.forEach((worker) => {
    getConsumableResources(worker).forEach(([type]) => {
      // producers that would keep their qol attempt to sell resources
      const isProducer = type === worker.type;
      if (isProducer && keepsQol(worker.resources, type))
        sells.push({ id: worker.id, type });
    });
  });

  const workerDic = Object.fromEntries(
    workers.map((worker) => [worker.id, worker])
  );

  sells.sort(Math.random);

  let sellIndex = 0;
  while (sells[sellIndex]) {
    const sell = sells[sellIndex];
    if (!sell) return;
    const { id: sellerId, type: sellType } = sell;
    const { resources: sellerResources } = workerDic[sellerId];

    // find buyer
    const hasBuyer = workers
      .filter((worker) => !keepsQol(worker.resources, sellType))
      .sort(Math.random)
      .some(({ resources: buyerResources }) => {
        if (sellType === "money") return false;
        const cost = prices[sellType];
        // transfer 1 unit of the resource from seller to buyer for COST
        const hasMoney = buyerResources.money >= cost;
        if (hasMoney) {
          buyerResources[sellType] += 1;
          sellerResources[sellType] -= 1;
          // apply tax
          buyerResources.money -= cost;
          const tax = calculateTax(taxResources, cost);
          sellerResources.money += cost - tax;
          taxResources.money += tax;
          return true;
        }
        return false;
      });
    // remove seller if the seller would change its QoL by selling
    if (!keepsQol(sellerResources, sellType)) sells[sellIndex] = null;

    // go to next seller when there are no buyers left
    if (!hasBuyer) sellIndex = (sellIndex + 1) % sells.length;
  }

  // for each resource, change its price if necessary
  // Object.entries(prices).forEach(([type, price]) => {
  //   console.log(type, price);
  // });
}

export function applyRules(workers: Worker[], taxCentre: TaxCentre) {
  const prices = { food: 10, water: 10, wood: 10 };
  const marketplace: MarketPlace = { sells: [], prices };
  useResources(workers);
  transact(workers, taxCentre, marketplace);
}
