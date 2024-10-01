import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchVrfData } from "@/api/vrf";
import { Mode, ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCredits } from "@/hooks/useCredits";
import TournamentTimer from "../components/TournamentTimer";
import { useSettings } from "@/hooks/useSettings";
import { ethers } from "ethers";

interface StartProps {
  mode: ModeType;
  handleGameMode: () => void;
  potentialWinnings: string; // New prop for potential winnings
}

export const Start: React.FC<StartProps> = ({
  mode,
  handleGameMode,
  potentialWinnings,
}) => {
  const {
    master,
    setup: {
      systemCalls: { start },
    },
  } = useDojo();

  const { account } = useAccountCustom();

  const { player } = usePlayer({ playerId: account?.address });
  const { credits } = useCredits({ playerId: account?.address });
  const { settings } = useSettings();

  const { game } = useGame({
    gameId: player?.game_id || "0x0",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!settings) return;

    setIsLoading(true);
    try {
      const {
        seed,
        proof_gamma_x,
        proof_gamma_y,
        proof_c,
        proof_s,
        proof_verify_hint,
        beta,
      } = await fetchVrfData();

      await start({
        account: account as Account,
        mode: new Mode(mode).into(),
        price:
          mode === ModeType.Daily
            ? settings.daily_mode_price
            : settings.normal_mode_price,
        seed,
        x: proof_gamma_x,
        y: proof_gamma_y,
        c: proof_c,
        s: proof_s,
        sqrt_ratio_hint: proof_verify_hint,
        beta: beta,
      });
      handleGameMode();
    } finally {
      setIsLoading(false);
    }
  }, [account, mode, settings]);

  const disabled = useMemo(() => {
    return (
      !account ||
      !master ||
      account === master ||
      !player ||
      (!!game && !game.isOver())
    );
  }, [account, master, player, game]);

  const cost = useMemo(() => {
    if (player && credits && credits.get_remaining(Date.now() / 1000) > 0)
      return "Free";
    else if (!settings) return "";

    const weiCost =
      mode === ModeType.Daily
        ? settings.daily_mode_price
        : settings.normal_mode_price;

    const ethCost = ethers.utils.formatEther(weiCost);

    return `${ethCost} ETH`;
  }, [player, credits, settings, mode]);

  return (
    <div className=" p-4 rounded-lg shadow-lg w-full h-full bg-gray-900 m-2">
      <h2 className="text-2xl font-bold mb-2">
        {mode === ModeType.Daily ? "Daily Mode" : "Normal Mode"}
      </h2>
      <p className="text-lg">
        <strong>Potential Winnings:</strong> {potentialWinnings}
      </p>
      <p className="text-lg">
        <strong>Price:</strong> {cost}
      </p>
      <TournamentTimer mode={mode} />
      <Button
        disabled={isLoading || disabled}
        isLoading={isLoading}
        onClick={handleClick}
        className="text-xl mt-4 w-full transition-transform duration-300 ease-in-out hover:scale-105"
      >
        Play
      </Button>
    </div>
  );
};
