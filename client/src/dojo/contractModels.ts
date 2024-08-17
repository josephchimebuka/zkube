import { defineComponent, Type as RecsType, World } from "@dojoengine/recs";

export type ContractComponents = Awaited<
  ReturnType<typeof defineContractComponents>
>;

export function defineContractComponents(world: World) {
  return {
    Game: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          difficulty: RecsType.Number,
          over: RecsType.Boolean,
          score: RecsType.Number,
          moves: RecsType.Number,
          next_row: RecsType.Number,
          next_color: RecsType.Number,
          hammer_bonus: RecsType.Number,
          wave_bonus: RecsType.Number,
          totem_bonus: RecsType.Number,
          combo_counter: RecsType.Number,
          blocks: RecsType.BigInt,
          colors: RecsType.BigInt,
          player_id: RecsType.BigInt,
          seed: RecsType.BigInt,
        },
        {
          metadata: {
            name: "zkube-Game",
            types: [
              "u32",
              "u8",
              "bool",
              "u32",
              "u32",
              "u32",
              "u32",
              "u8",
              "u8",
              "u8",
              "u8",
              "felt252",
              "felt252",
              "felt252",
              "felt252",
            ],
            customTypes: [],
          },
        },
      );
    })(),
    Player: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.BigInt,
          game_id: RecsType.Number,
          hammer_bonus: RecsType.Number,
          wave_bonus: RecsType.Number,
          totem_bonus: RecsType.Number,
          name: RecsType.BigInt,
          points: RecsType.Number,
        },
        {
          metadata: {
            name: "zkube-Player",
            types: ["felt252", "u32", "u8", "u8", "u8", "felt252", "u32"],
            customTypes: [],
          },
        },
      );
    })(),
  };
}
