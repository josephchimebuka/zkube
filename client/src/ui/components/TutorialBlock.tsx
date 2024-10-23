import React, { useEffect, useRef, useState } from "react";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";

interface BlockProps {
  block: Block;
  gridSize: number;
  isTxProcessing?: boolean;
  transitionDuration?: number;
  state?: GameState;
  handleMouseDown?: (
    e: React.MouseEvent<HTMLDivElement>,
    block: BlockProps["block"],
  ) => void;
  handleTouchStart?: (
    e: React.TouchEvent<HTMLDivElement>,
    block: BlockProps["block"],
  ) => void;
  onTransitionBlockStart?: () => void;
  onTransitionBlockEnd?: () => void;
  isHighlighted?: boolean;
  highlightType?: 'block' | 'row';
  isClickable?: boolean;
}

const BlockContainer: React.FC<BlockProps> = ({
  block,
  gridSize,
  transitionDuration = 100,
  isTxProcessing = false,
  state,
  handleMouseDown = () => {},
  handleTouchStart = () => {},
  onTransitionBlockStart = () => {},
  onTransitionBlockEnd = () => {},
  isHighlighted,
  highlightType = 'block',
  isClickable,
}) => {
  const [transitionStatus, setTransition] = useState("End");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current === null) return;

    const onTransitionStart = () => {
      onTransitionBlockStart();
      setTransition("Start");
    };

    // Ajout de l'événement
    ref.current.addEventListener("transitionstart", onTransitionStart);

    // Nettoyage de l'événement à la fin du cycle de vie
    return () => {
      ref.current?.removeEventListener("transitionstart", onTransitionStart);
    };
  }, []);

  // Gestion de la fin de la transition via l'événement onTransitionEnd
  const handleTransitionEnd = () => {
    setTransition("End");
    onTransitionBlockEnd(); // Notifier que la transition est terminée
  };

  const highlightClass = isHighlighted
    ? highlightType === 'row'
      ? 'ring-2 ring-yellow-400 ring-opacity-50' // Subtle row highlight
      : 'ring-4 ring-yellow-400 animate-pulse'   // More prominent single block highlight
    : '';

  return (
    <div
      className={`block block-${block.width} ${isTxProcessing ? "cursor-wait" : " curso"}  ${highlightClass} ${isHighlighted ? '' : isClickable }`}
      ref={ref}
      style={{
        position: "absolute",
        top: `${block.y * gridSize + 1}px`,
        left: `${block.x * gridSize + 1}px`,
        width: `${block.width * gridSize}px`,
        height: `${gridSize}px`,
        transition:
          state === GameState.GRAVITY ||
          state === GameState.GRAVITY2 ||
          state === GameState.GRAVITY_BONUS
            ? `top ${transitionDuration / 1000}s linear`
            : "none", // Désactivation de la transition autrement
        color: "white",
      }}
      onMouseDown={(e) => handleMouseDown(e, block)}
      onTouchStart={(e) => handleTouchStart(e, block)}
      onTransitionEnd={handleTransitionEnd}
    ></div>
  );
};

export default BlockContainer;
