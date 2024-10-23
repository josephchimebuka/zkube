import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TutorialGrid from "../components/TutorialGrid";
import { Block } from "@/types/types";
import { Card } from "../elements/card";
import GameBonus from "../containers/GameBonus";
import { transformDataContratIntoBlock } from "@/utils/gridUtils";
import { BonusName } from "@/enums/bonusEnum";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import NextLine from "../components/NextLine";
import { useMediaQuery } from "react-responsive";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "../components/MaxComboIcon";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { set } from "date-fns";

const Tutorial = ({
  showGrid,
  showTutorialText,
}: {
  showGrid: any;
  showTutorialText: any;
}) => {
  const [level, setLevel] = useState<number | "">(0);
  const [score, setScore] = useState<number | undefined>(0);
  const [tutorialStep, setTutorialStep] = useState<number>(1); // Step 1 of the tutorial
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const [waveCount, setWaveCount] = useState(2);
  const [totemCount, setTotemCount] = useState(2);
  const [hammerCount, setHammerCount] = useState(3);
  const [bonus, setBonus] = useState<BonusName>(BonusName.NONE);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [gridData, setGridData] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 2, 0, 0, 0, 0],
    [0, 1, 2, 3, 0],
    [2, 0, 0, 3, 2],
    [1, 0, 2, 2, 0, 0, 1, 1],
    [3, 0, 0, 1, 0, 0, 2], // 9th row
  ]);

  const usebonus = useRef<{ useBonus: (bonus: any, row_index: any, block_index: any) => void } | null>(null);
  const rows = 10;
  const cols = 8;
  const gridSize = isMdOrLarger ? 50 : 40;
  const combo = 0;
  const maxCombo = 0;
  let nextLine = [0, 0, 0, 0];

  const updateValue = (newValue:  number) => {
    setTutorialStep(newValue);
  }

  //   const randomizeNextLine = () => {
  //     nextLine = Array(4)
  //       .fill(0)
  //       .map(() => Math.floor(Math.random() * 3));
  //     console.log(nextLine); // Log the updated nextLine array
  //   };

  const handleBonusWaveClick = () => {
    if (waveCount === 0) return;
    if (bonus === BonusName.WAVE) {
      setBonus(BonusName.WAVE);
    } else setBonus(BonusName.NONE);
  };

  const handleBonusTikiClick = () => {
    if (totemCount === 0) return;
    if (bonus === BonusName.TIKI) {
      setBonus(BonusName.TIKI);
    } else setBonus(BonusName.NONE);
  };

  const handleBonusHammerClick = () => {
    if (hammerCount === 0) return;
    if (bonus === BonusName.HAMMER) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.HAMMER);
  };

  const applybonus = async ({
    bonus,
    row_index,
    block_index,
  }: {
    bonus: any;
    row_index: any;
    block_index: any;
  }) => {
    try {
      console.log("applying bonus", bonus, row_index, block_index);
      const calluseBonus = () => {
        if (usebonus.current) {
          usebonus.current.useBonus(bonus, row_index, block_index);
        }
      }
      const response = calluseBonus();
      console.log(response);
      return true;
    } catch (error) {
      console.error("Error executing bonus:", error);
      throw error;
    }
  };

  const handleBonusWaveTx = useCallback(async (rowIndex: number) => {
    try {
      const wave = await applybonus({
        bonus: 3,
        row_index: rows - rowIndex - 1,
        block_index: 0,
      });

      if (wave) {
        setWaveCount(waveCount - 1);
        console.log("bonus applied");
        console.log("wavecount", waveCount);
      }
    } finally {
      //setIsLoading(false);
    }
  }, []);

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      console.log("hammer with block", rowIndex, cols - colIndex);
      try {
        const hammer = await applybonus({
          bonus: 1,
          row_index: rows - rowIndex - 1,
          block_index: colIndex,
        });
        if (hammer) {
          setHammerCount(hammerCount - 1);
          console.log("bonus applied");
          console.log("hammercount", hammerCount);
        }
      } finally {
        //setIsLoading(false);
      }
    },
    [],
  );

  const handleBonusTikiTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      try {
        const tiki = await applybonus({
          bonus: 2,
          row_index: rows - rowIndex - 1,
          block_index: colIndex,
        });

        if (tiki) {
          setTotemCount(totemCount - 1);
          console.log("bonus applied");
          console.log("totemCount", totemCount);
        }
      } finally {
        //setIsLoading(false);
      }
    },
    [],
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      if (bonus === BonusName.WAVE) {
        console.log("wave with block", block);
        handleBonusWaveTx(block.y);
      }
      if (bonus === BonusName.TIKI) {
        console.log("tiki with block", block);
        handleBonusTikiTx(block.y, block.x);
      }
      if (bonus === BonusName.HAMMER) {
        console.log("hammer with block", block);
        handleBonusHammerTx(block.y, block.x);
      }
      if (bonus === BonusName.NONE) {
        console.log("none", block);
      }

      // For tutorial step 1, track block movement
      if (tutorialStep === 1) {
        // // Check if this is the correct starting block
        const isTargetBlock = block.y === 8 && block.x === 2;

        // Track the block's final position after drag
        const finalPosition = Math.round(block.x);

        if (!isTargetBlock){
            console.log('block', block);
        }

        // Check if block was moved two spaces to the right (from x=2 to x=4)
        if (isTargetBlock && finalPosition === 2) {
          console.log("Block moved to correct position!");
        } else {
          console.log("Block not in correct position:", finalPosition);
        }
      } else if (tutorialStep === 2) {
        // Check if this is the correct starting block
        const isTargetBlock = block.y === 9 && block.x <= 6;

        // Track the block's final position after drag
        const finalPosition = Math.round(block.x);

        // Check if block was moved two spaces to the right (from x=2 to x=4)
        if (isTargetBlock && finalPosition === 6) {

            // setTutorialStep(3);
          console.log("Block moved to correct position!");
        } else {
          console.log("Block not in correct position:", finalPosition);
        }
      } else if (tutorialStep === 3) {
        // Check if this is the correct starting block
        const isTargetBlock = block.y === 8 && block.x >= 0;

        // Track the block's final position after drag
        const finalPosition = Math.round(block.x);

        // Check if block was moved two spaces to the right (from x=2 to x=4)
        if (isTargetBlock && finalPosition === 0) {
          console.log("Block moved to correct position!");
          setTutorialStep(4);
        } else {
          console.log("Block not in correct position:", finalPosition);
        }
      }
    },
    [bonus, tutorialStep],
  );

  const tutorialTargetBlock: {
    x: number;
    y: number;
    type: "block" | "row";
  } | null = useMemo(() => {
    if (tutorialStep === 1) {
      return { x: 2, y: 8, type: "block" }; // The block we want to highlight in step 1
    }

    if (tutorialStep === 2) {
      return { x: 6, y: 9, type: "block" }; // The block we want to highlight in step 1
    }
    if (tutorialStep === 3) {
      return { x: 0, y: 8, type: "row" }; // The block we want to highlight in step 1
    }
    return null;
  }, [tutorialStep]);

  const memorizedInitialData = useMemo(
    () => transformDataContratIntoBlock(gridData),
    [gridData],
  );
  const memorizedNextLineData = useMemo(
    () => transformDataContratIntoBlock([nextLine]),
    [nextLine],
  );

  const displayScore = useLerpNumber(score, { integer: true });
  const displayCombo = useLerpNumber(combo, { integer: true });
  const displayMaxCombo = useLerpNumber(maxCombo, { integer: true });

  return (
    <div className="flex flex-col items-center w-[500px]">
      {showGrid && (
        <>
          <Card
            className={`p-4 bg-secondary ${isTxProcessing ? "cursor-wait" : "cursor-move"}`}
          >
            <div
              className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-4 flex justify-between`}
            >
              <div className="w-5/12">
                <GameBonus
                  onBonusWaveClick={handleBonusWaveClick}
                  onBonusTikiClick={handleBonusTikiClick}
                  onBonusHammerClick={handleBonusHammerClick}
                  hammerCount={hammerCount}
                  tikiCount={totemCount}
                  waveCount={waveCount}
                  bonus={bonus}
                />
              </div>
              <div className="flex gap-2">
                <div
                  className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
                >
                  <span>{displayScore}</span>
                  <FontAwesomeIcon
                    icon={faStar}
                    className="text-yellow-500 ml-1"
                    width={26}
                    height={26}
                  />
                </div>
                <div
                  className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
                >
                  <span
                    className={`${isMdOrLarger ? "w-[38px]" : "w-[26px]"} text-right`}
                  >
                    {displayCombo}
                  </span>
                  <FontAwesomeIcon
                    icon={faFire}
                    className="text-yellow-500 ml-1"
                    width={26}
                    height={26}
                  />
                </div>
                <div
                  className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
                >
                  <span
                    className={`${isMdOrLarger ? "w-[20px]" : "w-[13px]"} text-right`}
                  >
                    {displayMaxCombo}
                  </span>
                  <MaxComboIcon
                    width={isMdOrLarger ? 31 : 25}
                    height={isMdOrLarger ? 31 : 25}
                    className="text-yellow-500 ml-1"
                  />
                </div>
              </div>
            </div>
            {/* Step 1: Tutorial Text Box */}
            {tutorialStep === 1 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4">
                <h2>
                  Step 1: Move the highlighted block two steps to the right.
                </h2>
              </div>
            )}
            {tutorialStep === 2 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4">
                <h2>
                  Step 2: click on the hammer icon on the top left of the game
                  screen, then click on the highlighted block to use the bonus
                  and remove it.
                </h2>
              </div>
            )}
            {tutorialStep === 3 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4">
                <h2>
                  Step 3: click on the wave icon on the top left of the game
                  screen, then double click on the highlighted row of block to
                  use the bonus and remove it.
                </h2>
              </div>
            )}
            <div className="flex justify-center items-center">
              <TutorialGrid
                initialData={memorizedInitialData}
                nextLineData={memorizedNextLineData}
                gridSize={gridSize}
                gridHeight={rows}
                gridWidth={cols}
                selectBlock={selectBlock}
                bonus={bonus}
                account={null}
                tutorialStep={tutorialStep}
                tutorialTargetBlock={tutorialTargetBlock}
                onUpdate={updateValue}
                ref= {usebonus}
              />
            </div>
            <br />
            <div className="flex justify-center items-center">
              <NextLine
                nextLineData={transformDataContratIntoBlock([nextLine])}
                gridSize={gridSize}
                gridHeight={1}
                gridWidth={cols}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Tutorial;