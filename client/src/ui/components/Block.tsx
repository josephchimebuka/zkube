import React, { useEffect, useRef, useState } from "react";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import { ParticlesExplode } from "./ParticlesExplode";

interface BlockProps {
  block: Block;
  gridSize: number;
  gridHeight?: number;
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
}

const BlockContainer: React.FC<BlockProps> = ({
  block,
  gridSize,
  gridHeight = 10,
  transitionDuration = 100,
  isTxProcessing = false,
  state,
  handleMouseDown = () => {},
  handleTouchStart = () => {},
  onTransitionBlockStart = () => {},
  onTransitionBlockEnd = () => {},
}) => {
  const [transitionStatus, setTransition] = useState("End");
  const ref = useRef<HTMLDivElement | null>(null);
  const [rectDiv, setRectDiv] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [triggerParticles, setTriggerParticles] = useState(false);
  const [emitterPosition, setEmitterPosition] = useState({ x: 50, y: 50 }); // Position par défaut du milieu

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setRectDiv({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    if (ref.current === null) return;

    const onTransitionStart = () => {
      onTransitionBlockStart();
      setTransition("Start");
    };

    ref.current.addEventListener("transitionstart", onTransitionStart);

    return () => {
      ref.current?.removeEventListener("transitionstart", onTransitionStart);
    };
  }, []);

  // Gestion de la fin de la transition via l'événement onTransitionEnd
  const handleTransitionEnd = () => {
    setTransition("End");
    setTriggerParticles(true);
    setEmitterPosition({
      x: rectDiv.top + rectDiv.height / 2,
      y: rectDiv.left + rectDiv.width / 2,
    });
    onTransitionBlockEnd(); // Notifier que la transition est terminée
  };

  return (
    <div
      className={`block block-${block.width} ${isTxProcessing ? "cursor-wait" : ""} ${block.y != gridHeight - 1 ? "z-10" : ""}`}
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
    >
      {triggerParticles && <ParticlesExplode position={emitterPosition} />}
    </div>
  );
};

export default BlockContainer;
