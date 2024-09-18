import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/elements/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/elements/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
import {
  AreaChart,
  CartesianGrid,
  XAxis,
  Area,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/ui/elements/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/elements/table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faStar,
  faArrowsAltH,
} from "@fortawesome/free-solid-svg-icons";
import { Game } from "@/dojo/game/models/game";

// Format dates
const formatDate = (date: Date): string =>
  `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;

// Generate data for charts 
const generateChartData = (games: Game[]) =>
  games.map((game) => ({
    score: game.score,
    date: formatDate(new Date(Number(game.start_time) * 1000)),
    combo: game.combo,
    moves: game.moves,
  }));

// Compute stats 
const calculateStatistics = (games: Game[]) => {
  const totalGamesPlayed = games.length;
  const totalScore = games.reduce((sum, game) => sum + game.score, 0);
  const highestScore = Math.max(...games.map((game) => game.score), 0);
  const averageScore = totalGamesPlayed > 0 ? totalScore / totalGamesPlayed : 0;

  return { highestScore, totalGamesPlayed, totalScore, averageScore };
};

const filterGamesByDate = (games: Game[], period: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return games.filter((game) => {
    const gameDate = new Date(Number(game.start_time) * 1000);
    gameDate.setHours(0, 0, 0, 0);

    switch (period) {
      case "Today":
        return gameDate.getTime() === now.getTime();
      case "Month":
        return (
          gameDate.getMonth() === now.getMonth() &&
          gameDate.getFullYear() === now.getFullYear()
        );
      case "Year":
        return gameDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};

// Bonus usage management 
const calculateBonusUsage = (games: Game[]) =>
  games.reduce(
    (acc, game) => ({
      hammerTotal: acc.hammerTotal + game.hammer,
      waveTotal: acc.waveTotal + game.wave,
      totemTotal: acc.totemTotal + game.totem,
      hammerUsed: acc.hammerUsed + game.hammer_used,
      waveUsed: acc.waveUsed + game.wave_used,
      totemUsed: acc.totemUsed + game.totem_used,
    }),
    { hammerTotal: 0, waveTotal: 0, totemTotal: 0, hammerUsed: 0, waveUsed: 0, totemUsed: 0 }
  );

export const Statistics: React.FC<{ games: Game[] }> = ({ games }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [data, setData] = useState(generateChartData(filteredGames));

  useEffect(() => {
    const filtered = filterGamesByDate(games, selectedPeriod);
    setFilteredGames(filtered);
    setData(generateChartData(filtered));
  }, [games, selectedPeriod]);

  const { highestScore, totalGamesPlayed, totalScore, averageScore } =
    calculateStatistics(filteredGames);

  const chartConfig: ChartConfig = {};

  const bonusData = useMemo(() => {
    const filteredGames = filterGamesByDate(games, selectedPeriod);
    const { hammerTotal, waveTotal, totemTotal, hammerUsed, waveUsed, totemUsed } =
      calculateBonusUsage(filteredGames);
    return [
      { bonusType: "Hammer", count: hammerTotal, use: hammerUsed },
      { bonusType: "Wave", count: waveTotal, use: waveUsed },
      { bonusType: "Totem", count: totemTotal, use: totemUsed },
    ];
  }, [games, selectedPeriod]);

  return (
    <main className="flex flex-col items-center justify-start">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Select onValueChange={setSelectedPeriod} defaultValue="All">
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`[ ${data[0]?.date} ~ ${data[data.length - 1]?.date} ]`}
                />
              </SelectTrigger>
              <SelectContent className="z-[2100]">
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Month">This Month</SelectItem>
                <SelectItem value="Year">This Year</SelectItem>
                <SelectItem value="All">All</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Games Played</CardTitle>
                    </CardHeader>
                    <CardContent className="text-4xl">
                      {totalGamesPlayed}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Highest Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-4xl">
                      {highestScore}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Average Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-4xl">
                      {averageScore.toFixed(1)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-4xl">{totalScore}</CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts">
                <Card>
                  <CardHeader>
                    <CardTitle>Score per game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine
                          axisLine={true}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 10)}
                        />
                        <ChartTooltip
                          cursor
                          content={
                            <ChartTooltipContent indicator="dot" hideLabel />
                          }
                        />
                        <Area
                          dataKey="score"
                          type="natural"
                          stroke="hsl(var(--accent))"
                          strokeWidth={4}
                          dot
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Bonus earned and used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="mx-auto aspect-square"
                    >
                      <RadarChart data={bonusData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="bonusType" />
                        <Radar
                          name="Bonus earned"
                          dataKey="count"
                          stroke="hsl(var(--accent))"
                          fill="hsl(var(--accent))"
                          fillOpacity={1}
                        />
                        <Radar
                          name="Bonus usage"
                          dataKey="use"
                          stroke="#1e5178"
                          fill="#1e5178"
                          fillOpacity={1}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                      </RadarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="details">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>
                        <FontAwesomeIcon
                          icon={faStar}
                          className="text-yellow-500"
                        />
                      </TableHead>
                      <TableHead>
                        <FontAwesomeIcon
                          icon={faFire}
                          className="text-yellow-500"
                        />
                      </TableHead>
                      <TableHead>
                        <FontAwesomeIcon
                          icon={faArrowsAltH}
                          className="text-yellow-500"
                        />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((game, index) => (
                      <TableRow key={index}>
                        <TableCell>{game.date}</TableCell>
                        <TableCell>{game.score}</TableCell>
                        <TableCell>{game.combo}</TableCell>
                        <TableCell>{game.moves}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
