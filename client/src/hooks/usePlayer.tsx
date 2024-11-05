import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";

export const usePlayer = ({ playerId }: { playerId: string | undefined }) => {
  const {
    setup: {
      clientModels: {
        models: { Player },
        classes: { Player: PlayerClass },
      },
    },
  } = useDojo();

  const playerKey = useMemo(
    () => getEntityIdFromKeys([BigInt(playerId ? playerId : -1)]) as Entity,
    [playerId],
  );
  //console.log("playerKey", playerKey);
  const component = useComponentValue(Player, playerKey);
  //console.log("component", component);
  const player = useDeepMemo(() => {
    return component ? new PlayerClass(component) : null;
  }, [component]);

  if (!playerId) return { player: null, playerKey: null };

  return { player, playerKey };
};
