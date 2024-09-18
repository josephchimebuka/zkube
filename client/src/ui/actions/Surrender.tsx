import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/ui/elements/dialog";
import useAccountCustom from "@/hooks/useAccountCustom";

interface SurrenderProps {
  setIsUnmounting: (value: boolean) => void;
}

export const Surrender: React.FC<SurrenderProps> = ({ setIsUnmounting }) => {
  const { account } = useAccountCustom();
  const {
    master,
    setup: {
      systemCalls: { surrender },
    },
  } = useDojo();
  const { player } = usePlayer({ playerId: account?.address });
  const { game } = useGame({
    gameId: player?.game_id || "0x0",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsUnmounting(true);
    setIsLoading(true);
    try {
      await surrender({ account: account as Account });
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const disabled = useMemo(() => {
    return (
      !account || !master || account === master || !player || !game || game.over
    );
  }, [account, master, player, game]);

  if (disabled) return null;

  return (
    <div className="flex gap-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            disabled={isLoading}
            isLoading={isLoading}
            className="text-xl"
          >
            Surrender
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Surrender Game?</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 w-full">
            <DialogClose asChild className="w-1/2">
              <Button>No, Continue Playing</Button>
            </DialogClose>
            <DialogClose asChild className="w-1/2">
              <Button
                variant="destructive"
                disabled={isLoading}
                isLoading={isLoading}
                onClick={handleClick}
              >
                Yes, Surrender
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
