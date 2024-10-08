import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../elements/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import { BonusName } from "@/enums/bonusEnum";

interface BonusButtonProps {
  onClick?: () => void;
  urlImage: string;
  bonusCount: number;
  tooltipText: string; // Ajout d'une nouvelle prop pour le texte du tooltip
  bonusName: BonusName;
  bonus: BonusName;
}

const BonusButton: React.FC<BonusButtonProps> = ({
  onClick,
  urlImage,
  bonusCount,
  tooltipText,
  bonusName,
  bonus,
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const altText = "image for bonus";

  const handleClick = () => {
    setIsClicked(isClicked);
    console.log("click on bonus button");
    if (onClick) {
      onClick();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ rotate: 0 }}
            exit={{ rotate: 0 }}
            whileHover={isClicked ? {} : { rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className={`relative`}
          >
            <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs sm:text-sm rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center z-10 transform translate-x-1/2 -translate-y-1/2">
              {bonusCount}
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`md:p-2 sm:p-1 p-1 border ${bonus == bonusName ? "bg-yellow-500" : ""}`}
              onClick={handleClick}
              disabled={false}
            >
              <img src={urlImage} alt={altText} />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-sm">
            <p>{tooltipText}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BonusButton;
