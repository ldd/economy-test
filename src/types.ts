export type ProducedResourceType = "food" | "water" | "wood";
export type ResourceType = ProducedResourceType | "money";

export type TaxCenterType = Extract<ResourceType, "money"> | "tax_rate";
export type LabelType = ResourceType | TaxCenterType;

export interface Actor<T extends string | number | symbol = string> {
  id: string;
  alive: boolean;
  type: ResourceType;
  resources: Record<T, number>;
}

export type PotentialTrade = {
  id: string;
  type: ResourceType;
  unfulfilled?: true;
};
