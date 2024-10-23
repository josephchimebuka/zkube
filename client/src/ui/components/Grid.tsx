import { useCallback, useEffect, useState } from "react";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import BlockContainer from "./Block";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import {
  removeCompleteRows,
  concatenateAndShiftBlocks,
  isGridFull,
  removeBlocksSameWidth,
  removeBlocksSameRow,
  removeBlockId,
  deepCompareBlocks,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "framer-motion";
import { BonusType } from "@/dojo/game/types/bonus";
import { useMusicPlayer } from "@/contexts/music";

import "../../grid.css";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

interface GridProps {
  initialData: Block[];
  nextLineData: Block[];
  setNextLineHasBeenConsumed: React.Dispatch<React.SetStateAction<boolean>>;
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  selectBlock: (block: Block) => void;
  bonus: BonusType;
  account: Account | null;
  isTxProcessing: boolean;
  setIsTxProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setOptimisticScore: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticCombo: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticMaxCombo: React.Dispatch<React.SetStateAction<number>>;
}

const Grid: React.FC<GridProps> = ({
  initialData,
  nextLineData,
  setNextLineHasBeenConsumed,
  gridHeight,
  gridWidth,
  gridSize,
  selectBlock,
  bonus,
  account,
  setOptimisticScore,
  setOptimisticCombo,
  setOptimisticMaxCombo,
  isTxProcessing,
  setIsTxProcessing,
}) => {
  const {
    setup: {
      systemCalls: { move },
    },
  } = useDojo();

  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [nextLine, setNextLine] = useState<Block[]>(nextLineData);
  const [resetTxProcessing, setResetTxProcessing] = useState<boolean>(false);
  const [saveGridStateblocks, setSaveGridStateblocks] =
    useState<Block[]>(initialData);
  const [applyData, setApplyData] = useState(false);
  const [dragging, setDragging] = useState<Block | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [pendingMove, setPendingMove] = useState<{
    block: Block;
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [isPlayerInDanger, setIsPlayerInDanger] = useState(false);
  const [lineExplodedCount, setLineExplodedCount] = useState(0);
  const [blockBonus, setBlockBonus] = useState<Block | null>(null);
  const [animateText, setAnimateText] = useState<ComboMessages>(
    ComboMessages.None,
  );
  const [shouldBounce, setShouldBounce] = useState(false);
  const { playExplode, playSwipe } = useMusicPlayer();
  const borderSize = 2;
  const gravitySpeed = 100;
  const transitionDuration = VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ? 400 : 300;

  useEffect(() => {
    if (applyData) {
      if (deepCompareBlocks(saveGridStateblocks, initialData)) {
        return;
      }
      setSaveGridStateblocks(initialData);
      setBlocks(initialData);
      setNextLine(nextLineData);
      setApplyData(false);

      const inDanger = initialData.some((block) => block.y < 2);
      setIsPlayerInDanger(inDanger);
      setLineExplodedCount(0);
      setNextLineHasBeenConsumed(false);
      setResetTxProcessing(true);
    }
  }, [applyData, initialData]);

  useEffect(() => {
    if (resetTxProcessing) {
      const timeoutTXProcessing = setTimeout(() => {
        setIsTxProcessing(false);
        setResetTxProcessing(false);
      }, 200);

      return () => {
        clearTimeout(timeoutTXProcessing);
      };
    }
  }, [resetTxProcessing]);

  const resetAnimateText = (): void => {
    setAnimateText(ComboMessages.None);
  };

  useEffect(() => {
    if (lineExplodedCount > 0) {
      setShouldBounce(true); // Trigger bounce animation
      setTimeout(() => setShouldBounce(false), 500); // Stop bouncing after 0.5s
    }
  }, [lineExplodedCount]);

  const handleTransitionBlockStart = (id: number) => {
    setTransitioningBlocks((prev) => {
      const updatedBlocks = prev.includes(id) ? prev : [...prev, id];
      return updatedBlocks;
    });
  };

  const handleTransitionBlockEnd = (id: number) => {
    setTransitioningBlocks((prev) => {
      const updatedBlocks = prev.filter((blockId) => blockId !== id);
      return updatedBlocks;
    });
  };

  const handleDragMove = (x: number, moveType: MoveType) => {
    if (!dragging) return;
    if (isTxProcessing || applyData) return;

    const deltaX = x - dragStartX;
    const newX = initialX + deltaX / gridSize;
    const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

    if (
      !isBlocked(
        initialX,
        boundedX,
        dragging.y,
        dragging.width,
        blocks,
        dragging.id,
      )
    ) {
      // Vérifie si le nouveau X est en dehors des limites de la grille
      if (boundedX <= 0 || boundedX >= gridWidth - dragging.width) {
        if (moveType === MoveType.TOUCH) {
          endDrag(); // Appelle endDrag si le drag sort de la grille sur un touch
          return;
        } else {
          // Si on est en dehors de la grille, cela implique que la nouvelle start position a changer et on doit la mettre à jour
          setInitialX(blocks.find((b) => b.id === dragging.id)?.x ?? 0);
        }
      }
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === dragging.id ? { ...b, x: boundedX } : b,
        ),
      );
    }
  };

  const handleDragStart = (x: number, block: Block) => {
    setDragging(block);
    setDragStartX(x);
    setInitialX(block.x);
    setGameState(GameState.DRAGGING);
  };

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (isTxProcessing || applyData) return;

    setBlockBonus(block);
    if (bonus === BonusType.Wave) {
      setBlocks(removeBlocksSameRow(block, blocks));
    } else if (bonus === BonusType.Totem) {
      setBlocks(removeBlocksSameWidth(block, blocks));
    } else if (bonus === BonusType.Hammer) {
      setBlocks(removeBlockId(block, blocks));
    }

    // if we have a bonus, we go in state gravity_bonus
    if (bonus !== BonusType.None) {
      setIsTxProcessing(true);
      setIsMoving(true);
      setGameState(GameState.GRAVITY_BONUS);
      return;
    }
    handleDragStart(e.clientX, block);
  };

  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    if (isTxProcessing || applyData) return;

    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, MoveType.MOUSE);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, MoveType.TOUCH);
  };

  const endDrag = () => {
    if (!dragging) return;
    if (isTxProcessing || applyData) return;

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((b) => {
        if (b.id === dragging.id) {
          const finalX = Math.round(b.x);
          if (Math.trunc(finalX) !== Math.trunc(initialX)) {
            setPendingMove({
              block: b,
              rowIndex: b.y,
              startX: initialX,
              finalX,
            });
          }
          return { ...b, x: finalX };
        }
        return b;
      });
      return updatedBlocks;
    });

    setDragging(null);
    setIsMoving(true);
    setGameState(GameState.GRAVITY);
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      endDrag();
    };

    // Ajoute l'écouteur d'événements pour le document une seule fois.
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      // Nettoie l'écouteur d'événements lorsque le composant est démonté.
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (pendingMove) {
      const { rowIndex, startX, finalX } = pendingMove;
      handleMoveTX(rowIndex, startX, finalX);
    }
  }, [pendingMove]);

  const handleMoveTX = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (startColIndex === finalColIndex) return;
      if (!account) return;
      setIsTxProcessing(true);
      playSwipe();
      try {
        console.log(
          "Move TX (row, start col, end col)",
          gridHeight - 1 - rowIndex,
          startColIndex,
          finalColIndex,
        );
        await move({
          account: account as Account,
          row_index: gridHeight - 1 - rowIndex,
          start_index: Math.trunc(startColIndex),
          final_index: Math.trunc(finalColIndex),
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de la transaction", error);
      }
    },
    [account, isMoving, gridHeight, move],
  );

  const isBlocked = (
    initialX: number,
    newX: number,
    y: number,
    width: number,
    blocks: Block[],
    blockId: number,
  ) => {
    const rowBlocks = blocks.filter(
      (block) => block.y === y && block.id !== blockId,
    );

    if (newX > initialX) {
      for (const block of rowBlocks) {
        if (block.x >= initialX + width && block.x < newX + width) {
          return true;
        }
      }
    } else {
      for (const block of rowBlocks) {
        if (block.x + block.width > newX && block.x <= initialX) {
          return true;
        }
      }
    }

    return false;
  };

  const calculateFallDistance = (block: Block, blocks: Block[]) => {
    let maxFall = gridHeight - block.y - 1;
    for (let y = block.y + 1; y < gridHeight; y++) {
      if (isCollision(block.x, y, block.width, blocks, block.id)) {
        maxFall = y - block.y - 1;
        break;
      }
    }
    return maxFall;
  };

  const isCollision = (
    x: number,
    y: number,
    width: number,
    blocks: Block[],
    blockId: number,
  ) => {
    return blocks.some(
      (block) =>
        block.id !== blockId &&
        block.y === y &&
        x < block.x + block.width &&
        x + width > block.x,
    );
  };

  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(block, prevBlocks);
        if (fallDistance > 0) {
          return { ...block, y: block.y + 1 };
        }
        return block;
      });

      const blocksChanged = !prevBlocks.every((block, index) => {
        const newBlock = newBlocks.find((b) => b.id === block.id);
        return newBlock && block.x === newBlock.x && block.y === newBlock.y;
      });

      setIsMoving(blocksChanged);

      return newBlocks;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        gameState === GameState.GRAVITY ||
        gameState === GameState.GRAVITY2 ||
        gameState === GameState.GRAVITY_BONUS
      ) {
        applyGravity();
      }
    }, gravitySpeed);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (!isMoving && transitioningBlocks.length === 0) {
      if (gameState === GameState.GRAVITY) {
        setGameState(GameState.LINE_CLEAR);
      } else if (gameState === GameState.GRAVITY2) {
        setGameState(GameState.LINE_CLEAR2);
      } else if (gameState === GameState.GRAVITY_BONUS) {
        setGameState(GameState.LINE_CLEAR_BONUS);
      }
    }
  }, [gameState, isMoving, transitioningBlocks]);

  const handleLineClear = (
    newGravityState: GameState,
    newStateOnComplete: GameState,
  ) => {
    const { updatedBlocks, completeRows } = removeCompleteRows(
      blocks,
      gridWidth,
      gridHeight,
    );
    if (updatedBlocks.length < blocks.length) {
      playExplode();
      setLineExplodedCount(lineExplodedCount + completeRows.length);
      setBlocks(updatedBlocks);
      setIsMoving(true);
      setGameState(newGravityState);
    } else {
      setGameState(newStateOnComplete);
    }
  };

  useEffect(() => {
    if (gameState === GameState.LINE_CLEAR) {
      handleLineClear(GameState.GRAVITY, GameState.ADD_LINE);
    } else if (gameState === GameState.LINE_CLEAR2) {
      handleLineClear(GameState.GRAVITY2, GameState.MOVE_TX);
    } else if (gameState === GameState.LINE_CLEAR_BONUS) {
      handleLineClear(GameState.GRAVITY_BONUS, GameState.BONUS_TX);
    }
  }, [gameState, blocks]);

  useEffect(() => {
    // we calculate points and combo for optimistic rendering
    // ans we display text
    if (gameState === GameState.BONUS_TX || gameState === GameState.MOVE_TX) {
      // Calculate combo
      const current_combo = lineExplodedCount > 1 ? lineExplodedCount : 0;

      // Calculate points earned for this combo
      const pointsEarned = (lineExplodedCount * (lineExplodedCount + 1)) / 2;
      setOptimisticScore((prevPoints) => prevPoints + pointsEarned);

      setOptimisticCombo((prevCombo) => prevCombo + current_combo);

      // Update max combo if necessary
      setOptimisticMaxCombo((prevMaxCombo) =>
        current_combo > prevMaxCombo ? current_combo : prevMaxCombo,
      );

      if (lineExplodedCount > 1) {
        setAnimateText(Object.values(ComboMessages)[lineExplodedCount]);
      }
    }
  }, [gameState]);

  useEffect(() => {
    if (
      gameState === GameState.ADD_LINE &&
      pendingMove &&
      transitioningBlocks.length === 0
    ) {
      const { rowIndex, startX, finalX } = pendingMove;
      if (startX !== finalX) {
        const updatedBlocks = concatenateAndShiftBlocks(
          blocks,
          nextLine,
          gridHeight,
        );
        setNextLineHasBeenConsumed(true);
        if (isGridFull(updatedBlocks)) {
          setGameState(GameState.MOVE_TX);
        } else {
          setBlocks(updatedBlocks);
        }
      }
      setIsMoving(true);
      setGameState(GameState.GRAVITY2);
    }
  }, [gameState, blocks, pendingMove, transitioningBlocks]);

  useEffect(() => {
    if (gameState === GameState.BONUS_TX) {
      setApplyData(true);
      selectBlock(blockBonus as Block);
      setBlockBonus(null);
      setGameState(GameState.WAITING);
    }
    if (gameState === GameState.MOVE_TX) {
      if (pendingMove) {
        // const { rowIndex, startX, finalX } = pendingMove;
        // handleMoveTX(rowIndex, startX, finalX);
        setApplyData(true);
        setPendingMove(null);
        setGameState(GameState.WAITING);
      }
    }
  }, [gameState, pendingMove, handleMoveTX]);

  return (
    <motion.div
      animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div
        className={`grid-background ${isTxProcessing ? " cursor-wait animated-border" : "static-border"}`}
        id="grid"
      >
        <div
          className={`relative p-r-[1px] p-b-[1px] touch-action-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)] ${isPlayerInDanger ? " animated-box-player-danger" : ""}`}
          style={{
            height: `${gridHeight * gridSize + borderSize}px`,
            width: `${gridWidth * gridSize + borderSize}px`,
            backgroundImage:
              "linear-gradient(#1E293B 2px, transparent 2px), linear-gradient(to right, #1E293B 2px, #10172A 2px)",
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
          onMouseMove={handleMouseMove}
          //onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {blocks.map((block) => (
            <BlockContainer
              key={block.id}
              block={block}
              gridSize={gridSize}
              gridHeight={gridHeight}
              isTxProcessing={isTxProcessing}
              transitionDuration={transitionDuration}
              state={gameState}
              handleMouseDown={handleMouseDown}
              handleTouchStart={handleTouchStart}
              onTransitionBlockStart={() =>
                handleTransitionBlockStart(block.id)
              }
              onTransitionBlockEnd={() => handleTransitionBlockEnd(block.id)}
            />
          ))}
          <div className="flex items-center justify-center font-sans z-20 pointer-events-none">
            <AnimatedText textEnum={animateText} reset={resetAnimateText} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Grid;