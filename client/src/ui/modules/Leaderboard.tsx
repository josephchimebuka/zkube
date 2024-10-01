import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/elements/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/elements/pagination";
import { Button } from "@/ui/elements/button";
import { Game } from "@/dojo/game/models/game";
import { useGames } from "@/hooks/useGames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faGlobe,
  faStar,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { usePlayer } from "@/hooks/usePlayer";
import { useMediaQuery } from "react-responsive";
import { ModeType } from "@/dojo/game/types/mode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
import { Level } from "@/dojo/game/types/level";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/ui/elements/tooltip";
import useTournament from "@/hooks/useTournament";
import useCountdown from "@/hooks/useCountdown";
import { formatRemainingTime } from "../utils";

const GAME_PER_PAGE = 5;
const MAX_PAGE_COUNT = 5;

interface TabListProps {
  activeTab: ModeType;
  setActiveTab: React.Dispatch<React.SetStateAction<ModeType>>;
}

const TabList = memo<TabListProps>(({ activeTab, setActiveTab }) => (
  <TabsList className="grid w-[80%] mx-auto sm:w-full grid-cols-2">
    <TabsTrigger
      value={ModeType.Daily}
      onClick={() => setActiveTab(ModeType.Daily)}
    >
      Daily
    </TabsTrigger>
    <TabsTrigger
      value={ModeType.Normal}
      onClick={() => setActiveTab(ModeType.Normal)}
    >
      Normal
    </TabsTrigger>
  </TabsList>
));

export const Leaderboard = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Leaderboards</Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[700px] w-[95%] rounded-lg p-4"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex items-center text-2xl">
          <DialogTitle>Leaderboards</DialogTitle>
        </DialogHeader>
        <LeaderboardContent />
      </DialogContent>
    </Dialog>
  );
};

export const LeaderboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModeType>(ModeType.Daily);

  const dailyEndTimestamp = useTournament(ModeType.Daily).endTimestamp;
  const normalEndTimestamp = useTournament(ModeType.Normal).endTimestamp;

  const dailySecondsLeft = useCountdown(new Date(dailyEndTimestamp * 1000));
  const normalSecondsLeft = useCountdown(new Date(normalEndTimestamp * 1000));

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ModeType)}
    >
      <TabList activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabsContent value={ModeType.Daily}>
        <Content mode={ModeType.Daily} secondsLeft={dailySecondsLeft} />
      </TabsContent>
      <TabsContent value={ModeType.Normal}>
        <Content mode={ModeType.Normal} secondsLeft={normalSecondsLeft} />
      </TabsContent>
    </Tabs>
  );
};

interface ContentProps {
  mode: ModeType;
  secondsLeft: number;
}

export const Content: React.FC<ContentProps> = ({ mode, secondsLeft }) => {
  const { games } = useGames();
  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(0);

  const filteredGames = useMemo(() => {
    return games.filter((game) => game.mode.value === mode);
  }, [games, mode]);

  const { sortedGames, totalBuyIn, winningPool } = useMemo(() => {
    const sorted = filteredGames
      .filter((game) => game.score > 0)
      .sort((a, b) => b.combo - a.combo)
      .sort((a, b) => b.score - a.score);

    const totalBuyIn = sorted.reduce((sum, game) => sum + game.buyIn, 0);
    const winningPool = totalBuyIn * 0.9; // Assuming 10% goes to Zkube

    return { sortedGames: sorted, totalBuyIn, winningPool };
  }, [filteredGames]);

  // Distribute potential winnings amongs top 5 winners
  const distributionPercentages = [0.4, 0.25, 0.15, 0.1, 0.1];

  const gamesWithWinnings = useMemo(() => {
    return sortedGames.map((game, index) => {
      let potentialWinnings = 0;
      if (index < distributionPercentages.length) {
        potentialWinnings = winningPool * distributionPercentages[index];
      }
      return { ...game, potentialWinnings, isOver: () => game.over };
    });
  }, [sortedGames, winningPool]);

  useEffect(() => {
    const rem = Math.floor(sortedGames.length / (GAME_PER_PAGE + 1)) + 1;
    setPageCount(rem);
  }, [sortedGames]);

  useEffect(() => {
    setPage(1); // Reset to first page only when mode changes
  }, [mode]);

  const { start, end } = useMemo(() => {
    const start = (page - 1) * GAME_PER_PAGE;
    const end = start + GAME_PER_PAGE;
    return { start, end };
  }, [page]);

  const handlePrevious = useCallback(() => {
    if (page === 1) return;
    setPage((prev) => prev - 1);
  }, [page]);

  const handleNext = useCallback(() => {
    if (page === Math.min(pageCount, MAX_PAGE_COUNT)) return;
    setPage((prev) => prev + 1);
  }, [page, pageCount]);

  const disabled = useMemo(() => sortedGames.length > 0, [sortedGames]);

  const isSmallScreen = useMediaQuery({ query: "(min-width: 640px)" });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full border-b border-white flex justify-between items-center my-4 p-2">
        <h2 className="text-lg font-semibold">Next Challenge In:</h2>
        <p className="text-lg font-bold">
          {formatRemainingTime(mode, secondsLeft)}
        </p>
      </div>
      <Table className="text-sm sm:text-base sm:w-full ">
        <TableCaption className={`${disabled && "hidden"}`}>
          Leaderboard is waiting for its best players to make history
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10%] text-center">Rank</TableHead>
            <TableHead className="w-[35%] text-center">Name</TableHead>
            <TableHead className="w-[10%] text-center">lvl</TableHead>
            <TableHead className="w-[15%] text-center">
              <div className="flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
              </div>
            </TableHead>
            <TableHead className="w-[15%] text-center">
              <div className="flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faFire} className="text-slate-500" />
              </div>
            </TableHead>
            <TableHead className="w-[15%] text-center">
              <div className="flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faGlobe} className="text-slate-500" />
              </div>
            </TableHead>

            <TableHead className="w-[15%] text-center">
              <div className="flex items-center justify-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="">
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className="text-yellow-500"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className=" w-[180px] text-base"
                  >
                    Potential winnnings 1st place: 45%, 2nd place: 25%, 3rd
                    place: 15%, 4th place: 10%, 5th place: 10%, Zkube: 10%
                  </TooltipContent>
                </Tooltip>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gamesWithWinnings.slice(start, end).map((game, index) => (
            <Row
              key={index}
              rank={(page - 1) * GAME_PER_PAGE + index + 1}
              game={game}
            />
          ))}
        </TableBody>
      </Table>
      <Pagination className={`${!disabled && "hidden"} mt-5`}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={`${page === 1 && "opacity-50"}`}
              onClick={handlePrevious}
            />
          </PaginationItem>
          {isSmallScreen &&
            Array.from({ length: Math.min(pageCount, MAX_PAGE_COUNT) }).map(
              (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={index + 1 === page}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
          <PaginationItem>
            <PaginationNext
              className={`${page === Math.min(pageCount, MAX_PAGE_COUNT) && "opacity-50"}`}
              onClick={handleNext}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export const Row = memo(
  ({
    rank,
    game,
  }: {
    rank: number;
    game: Game & { potentialWinnings: number };
  }) => {
    const { player } = usePlayer({ playerId: game.player_id });

    return (
      <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-800">
        <TableCell className="text-center font-semibold">{`#${rank}`}</TableCell>
        <TableCell className="text-left sm:max-w-36 truncate">
          {player?.name || "-"}
        </TableCell>
        <TableCell className="text-center">
          {player?.points ? Level.fromPoints(player?.points).value : ""}
        </TableCell>
        <TableCell className="text-center font-bold">{game.score}</TableCell>
        <TableCell className="text-center font-bold">{game.combo}</TableCell>
        <TableCell className="text-center font-bold">
          {game.max_combo}
        </TableCell>
        <TableCell className="text-center font-bold">
          {game.potentialWinnings.toFixed(2)}
        </TableCell>
      </TableRow>
    );
  },
);
