import type { TaxCentre } from "./TaxCentre";
import { Transaction } from "./Transaction";
import type { Worker } from "./Worker";
import { PotentialTrade, ProducedResourceType, ResourceType } from "./types";

type SellRecord = Partial<Record<ResourceType, boolean>>;

export class Market {
  sells: (PotentialTrade | null)[];
  prices: Record<ProducedResourceType, number>;
  constructor() {
    this.sells = [];
    this.prices = { food: 10, water: 10, wood: 10 };
  }

  adjustPrices(sellRecord: SellRecord) {
    // for each resource, change its price if necessary
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
    this.sells = [];
    workers.forEach((worker) => {
      worker.getConsumableResources().forEach(([type, quantity]) => {
        // producers that would keep their qol attempt to sell resources
        const isProducer = type === worker.type;
        const shouldSell = quantity > 0 && worker.keepsQol(type);
        if (isProducer && shouldSell) this.sells.push({ id: worker.id, type });
      });
    });
    this.sells.sort(Math.random);
  }

  sellAll(workers: Worker[], taxer: TaxCentre) {
    const workerDic = Object.fromEntries(
      workers.map((worker) => [worker.id, worker])
    );
    const decreaseDic: SellRecord = {};

    let sellIndex = 0;
    while (this.sells[sellIndex]) {
      const sell = this.sells[sellIndex];
      if (!sell) return null;

      const { id: sellerId, type: sellType } = sell;
      const { alive: sellerAlive } = workerDic[sellerId];

      if (sellType === "money") return null;

      decreaseDic[sellType] ||= false;

      let buyer: undefined | Worker;
      if (!sellerAlive) buyer = undefined;
      else
        buyer = workers
          .filter((worker) => !worker.keepsQol(sellType))
          .filter((worker) => worker.id !== sellerId && worker.alive)
          .sort(Math.random)
          .find((worker) => worker.resources.money >= this.prices[sellType]);

      const seller = workerDic[sellerId];

      if (buyer) {
        // prettier-ignore
        const transaction = new Transaction({ buyer, seller , taxer, type: sellType});
        transaction.transact(sell, this.prices);
      }

      // remove seller if the seller would change its QoL by selling
      if (!sellerAlive || !seller.keepsQol(sellType))
        this.sells[sellIndex] = null;

      // go to next seller when there are no buyers left
      if (!buyer) sellIndex = (sellIndex + 1) % this.sells.length;
    }
    return decreaseDic;
  }
}
