import { uuid } from "./helper";
import type { Actor, TaxCenterType } from "./types";
import { Worker } from "./Worker";

const CLERK_SALARY = 150;

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
  // tax centre refills clerks pockets up until their salary
  distributeTax(workers: Worker[], refill: number) {
    const taxResources = this.resources;
    workers
      .filter((worker) => worker.type === "money")
      .forEach((worker) => {
        if (refill <= 0 || taxResources.money < refill) return;
        worker.resources.money += refill;
        taxResources.money -= refill;
      });
  }
  printMoney(min: number) {
    this.resources.money = Math.max(this.resources.money, min);
  }
}
