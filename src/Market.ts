import type { TaxCentre } from "./TaxCentre";
import { Transaction } from "./Transaction";
import type { Worker } from "./Worker";
import { PotentialTrade, ProducedResourceType, ResourceType } from "./types";

type SellRecord = Partial<Record<ResourceType, boolean>>;

export class Market {
  private sales: (PotentialTrade | null)[];
  prices: Record<ProducedResourceType, number>;
  constructor() {
    this.sales = [];
    this.prices = { food: 10, water: 10, wood: 10 };
  }

  adjustPrices(sellRecord: SellRecord) {
    // for each resource, change its price if necessary (based on sellRecord)
    Object.entries(this.prices).forEach((tuple) => {
      const [type, price] = tuple as [ProducedResourceType, number];
      if (sellRecord[type] === undefined) return;
      const newPrice = sellRecord[type]
        ? Math.floor(price * 0.95)
        : Math.ceil(price * 1.05);
      this.prices[type] = Math.max(1, newPrice);
    });
  }

  setupMarketplace(workers: Worker[]) {
    this.sales = [];
    workers.forEach((worker) => {
      worker.getConsumableResources().forEach(([type, quantity]) => {
        // producers that would keep their qol attempt to sell resources
        const isProducer = type === worker.type;
        const shouldSell = quantity > 0 && worker.keepsQol(type);
        if (isProducer && shouldSell) this.sales.push({ id: worker.id, type });
      });
    });
    this.sales.sort(Math.random);
  }

  sellAll(workers: Worker[], taxer: TaxCentre) {
    const workerDic = Object.fromEntries(
      workers.map((worker) => [worker.id, worker])
    );
    const decreaseDic: SellRecord = {};

    let sellIndex = 0;
    let hadSale = false;
    while (this.sales[sellIndex]) {
      const sell = this.sales[sellIndex];
      // we loop through all potential sales,
      // so we must reset hadSale in a new cycle to check if there were sales (otherwise we would be using info from another cycle)
      if (sellIndex === 0) hadSale = false;
      if (!sell) return null;

      const { id: sellerId, type } = sell;
      const seller = workerDic[sellerId];

      if (type === "money") return null;

      decreaseDic[type] ||= false;

      // find a valid buyer
      let buyer: undefined | Worker;
      if (!seller.alive) buyer = undefined;
      else
        buyer = workers
          .filter((worker) => !worker.keepsQol(type))
          .filter((worker) => worker.id !== sellerId && worker.alive)
          .sort(Math.random)
          .find((worker) => worker.resources.money >= this.prices[type]);

      if (buyer) {
        const transaction = new Transaction({ buyer, seller, taxer, type });
        transaction.transact(sell, this.prices);
        hadSale = true;
      }

      // remove seller when:
      // - it would change its QoL by selling
      // - it is no longer alive
      if (!seller.alive || !seller.keepsQol(type)) this.sales[sellIndex] = null;

      // no sales from potential sales, so exit early
      if (sellIndex === this.sales.length - 1 && !hadSale) {
        decreaseDic[type] = true;
        return;
      }

      // go to next seller when there are no buyers left
      if (!buyer) sellIndex = (sellIndex + 1) % this.sales.length;
    }
    return decreaseDic;
  }
  totalPrice(multiplier = 1) {
    return Object.values(this.prices).reduce(
      (total, quantity) => total + quantity * multiplier,
      0
    );
  }
}
