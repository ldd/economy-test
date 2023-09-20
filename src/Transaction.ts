import type { TaxCentre } from "./TaxCentre";
import type { Market } from "./Market";
import type { Worker } from "./Worker";
import { PotentialTrade, ResourceType } from "./types";

type TransactionProps = {
  buyer: Worker;
  seller: Worker;
  taxer: TaxCentre;
  type: ResourceType;
};

export class Transaction implements TransactionProps {
  buyer;
  seller;
  taxer;
  type;
  constructor(props: TransactionProps) {
    const { buyer, seller, taxer, type } = props;
    this.buyer = buyer;
    this.seller = seller;
    this.taxer = taxer;
    this.type = type;
  }
  sellProduct() {
    if (this.type === "money") return this.seller.resources[this.type];

    this.buyer.resources[this.type] += 1;
    this.seller.resources[this.type] -= 1;
    return this.seller.resources[this.type];
  }
  taxTransaction(cost: number) {
    this.buyer.resources.money -= cost;
    const tax = this.taxer.calculateTax(cost);
    this.seller.resources.money += cost - tax;
    this.taxer.resources.money += tax;
  }
  transact(trade: PotentialTrade, prices: Market["prices"]) {
    if (trade.type === "money") return;

    const quantity = this.sellProduct();
    if (quantity <= 0) this.seller.alive = false;

    const cost = prices[trade.type];
    this.taxTransaction(cost);
  }
}
