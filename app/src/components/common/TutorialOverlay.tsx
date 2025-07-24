import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTutorial } from '@contexts/TutorialContext';

export const TutorialOverlay: React.FC = () => {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updateTargetPosition = () => {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Initial positioning
    updateTargetPosition();

    // Update position on scroll or resize
    window.addEventListener('scroll', updateTargetPosition);
    window.addEventListener('resize', updateTargetPosition);

    return () => {
      window.removeEventListener('scroll', updateTargetPosition);
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [isActive, currentStepData]);

  if (!isActive || !currentStepData || !targetRect) return null;

  // Calculate tooltip position based on placement
  const calculateTooltipPosition = () => {
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate height

    let top = 0;
    let left = 0;

    switch (currentStepData.placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    if (top < padding) top = padding;
    if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    return { top, left };
  };

  const tooltipPosition = calculateTooltipPosition();

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop with spotlight effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            onClick={skipTutorial}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-75" />
            
            {/* Spotlight cutout */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={targetRect.left - 8}
                    y={targetRect.top - 8}
                    width={targetRect.width + 16}
                    height={targetRect.height + 16}
                    rx="8"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="black"
                fillOpacity="0.75"
                mask="url(#spotlight-mask)"
              />
            </svg>

            {/* Highlight border */}
            <motion.div
              className="absolute border-4 border-blue-500 rounded-lg pointer-events-none"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
              }}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 w-80"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={skipTutorial}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="チュートリアルをスキップ"
            >
              <FaTimes size={20} />
            </button>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-800 mb-2 pr-8">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentStepData.content}
            </p>

            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <FaChevronLeft size={16} />
                <span>前へ</span>
              </button>

              <span className="text-sm text-gray-500">
                {currentStep + 1} / {steps.length}
              </span>

              <button
                onClick={nextStep}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <span>{currentStep === steps.length - 1 ? '完了' : '次へ'}</span>
                <FaChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};