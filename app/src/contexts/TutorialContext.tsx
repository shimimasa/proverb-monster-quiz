import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TutorialStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Optional action to perform when this step is shown
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: (steps: TutorialStep[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_COMPLETED_KEY = 'quiz_tutorial_completed';
const TUTORIAL_SKIPPED_KEY = 'quiz_tutorial_skipped';

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);

  // Check if tutorial should auto-start
  useEffect(() => {
    const hasCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    const hasSkipped = localStorage.getItem(TUTORIAL_SKIPPED_KEY);
    
    if (!hasCompleted && !hasSkipped) {
      // Auto-start tutorial for first-time users
      // This will be triggered from the main component with appropriate steps
    }
  }, []);

  const startTutorial = (tutorialSteps: TutorialStep[]) => {
    setSteps(tutorialSteps);
    setCurrentStep(0);
    setIsActive(true);
    
    // Execute action for the first step if exists
    if (tutorialSteps[0]?.action) {
      tutorialSteps[0].action();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      
      // Execute action for the next step if exists
      if (steps[nextStepIndex]?.action) {
        steps[nextStepIndex].action();
      }
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      
      // Execute action for the previous step if exists
      if (steps[prevStepIndex]?.action) {
        steps[prevStepIndex].action();
      }
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    localStorage.setItem(TUTORIAL_SKIPPED_KEY, 'true');
  };

  const completeTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    // Remove skipped flag if it exists
    localStorage.removeItem(TUTORIAL_SKIPPED_KEY);
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        completeTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

// Helper function to check if tutorial has been completed or skipped
export function shouldShowTutorial(): boolean {
  const hasCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
  const hasSkipped = localStorage.getItem(TUTORIAL_SKIPPED_KEY);
  return !hasCompleted && !hasSkipped;
}

// Helper function to reset tutorial state (for testing or re-enabling)
export function resetTutorial(): void {
  localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  localStorage.removeItem(TUTORIAL_SKIPPED_KEY);
}