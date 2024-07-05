import { Hammer } from "../elements/bonuses/hammer";
import { Totem } from "../elements/bonuses/totem";
import { Wave } from "../elements/bonuses/wave";

import hammer from "/assets/bonus/hammer.png";
import tiki from "/assets/bonus/tiki.png";
import wave from "/assets/bonus/wave.png";

export enum BonusType {
  None = "None",
  Hammer = "Hammer",
  Totem = "Totem",
  Wave = "Wave",
}

export interface Condition {
  score: number;
  combo: number;
}

export class Bonus {
  value: BonusType;

  constructor(value: BonusType) {
    this.value = value;
  }

  public into(): number {
    return Object.values(BonusType).indexOf(this.value);
  }

  public static from(index: number): Bonus {
    const item = Object.values(BonusType)[index];
    return new Bonus(item);
  }

  public static getBonuses(): Bonus[] {
    return [
      new Bonus(BonusType.Hammer),
      new Bonus(BonusType.Wave),
      new Bonus(BonusType.Totem),
    ];
  }

  public isNone(): boolean {
    return this.value === BonusType.None;
  }

  public getIcon(): string {
    switch (this.value) {
      case BonusType.Hammer:
        return hammer;
      case BonusType.Totem:
        return tiki;
      case BonusType.Wave:
        return wave;
      default:
        return "";
    }
  }

  public getCount(score: number, combo: number): number {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getCount(score, combo);
      case BonusType.Totem:
        return Totem.getCount(score, combo);
      case BonusType.Wave:
        return Wave.getCount(score, combo);
      default:
        return 0;
    }
  }

  public getConditions(): Condition[] {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getConditions();
      case BonusType.Totem:
        return Totem.getConditions();
      case BonusType.Wave:
        return Wave.getConditions();
      default:
        return [];
    }
  }

  public getDescription(): string {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getDescription();
      case BonusType.Totem:
        return Totem.getDescription();
      case BonusType.Wave:
        return Wave.getDescription();
      default:
        return "";
    }
  }
}