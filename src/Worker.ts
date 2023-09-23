import { uuid } from "./helper";
import type { Actor, ResourceType } from "./types";

const TICK_PRODUCED = 10;

const consumableBlackList: Partial<Record<ResourceType, boolean>> = {
  money: true,
};

export class Worker implements Actor<ResourceType> {
  id = uuid();
  alive = true;
  type;
  resources;
  constructor(type: ResourceType) {
    const resources = { money: 50, food: 3, water: 3, wood: 3 };
    this.resources = resources;
    this.type = type;
  }
  qol() {
    return Math.max(
      Math.min(
        ...Object.entries(this.resources)
          .filter(
            ([someType]) => !consumableBlackList[someType as ResourceType]
          )
          .map(([, quantity]) => quantity)
      ),
      0
    );
  }
  keepsQol(type: ResourceType) {
    return Object.entries(this.resources)
      .filter(([someType]) => someType !== type)
      .filter(([someType]) => !consumableBlackList[someType as ResourceType])
      .some(([, quantity]) => quantity < this.resources[type]);
  }
  calculateConsumed(oldQuantity: number) {
    return Math.max(1, Math.floor(oldQuantity / 3));
  }
  getConsumableResources(): [ResourceType, number][] {
    return (Object.entries(this.resources) as [ResourceType, number][]).filter(
      ([type]) => !consumableBlackList[type]
    );
  }
  useResources() {
    this.getConsumableResources().forEach(([type, oldQuantity]) => {
      // either produce and increase quantity of resource, or consume it
      const isProducer = type === this.type;
      const quantity = isProducer
        ? TICK_PRODUCED
        : -this.calculateConsumed(oldQuantity);
      this.resources[type] += quantity;
      // min for a resource is 0
      this.resources[type] = Math.max(0, this.resources[type]);
    });
  }
}
