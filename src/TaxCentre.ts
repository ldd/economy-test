import type { Actor, TaxCenterType } from "./types";
import { Worker } from "./Worker";

const CLERK_SALARY = 150;

const uuid = () => `${Math.random()}`;

export class TaxCentre implements Actor<TaxCenterType> {
  id = uuid();
  alive = true;
  type: "money" = "money";
  resources;
  constructor(money: number, tax_rate: number) {
    this.resources = { money, tax_rate };
  }
  calculateTax(cost: number) {
    return Math.max(1, Math.floor(this.resources.tax_rate * cost));
  }
  distributeTax(workers: Worker[]) {
    // tax centre refills clerks pockets
    const taxResources = this.resources;
    workers
      .filter((worker) => worker.type === "money")
      .forEach((worker) => {
        const refill = CLERK_SALARY - worker.resources.money;
        if (refill <= 0 || taxResources.money < refill) return;
        worker.resources.money += refill;
        taxResources.money -= refill;
      });
  }
  printMoney() {
    return (this.resources.money = 1000);
  }
}
