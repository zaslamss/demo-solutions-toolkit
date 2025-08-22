import React from 'react';
import { WizardStep } from '../types'; 
import { useTool } from './ToolContext'; 
import { Check } from 'react-bootstrap-icons'; 

interface ProgressTrackerProps {
  steps: WizardStep[];
}

const ProgressTracker = ({ steps }: ProgressTrackerProps) => {
  const { currentStep, stepHistory } = useTool();
  const currentStepId = currentStep?.stepId;

  const visibleSteps = steps.filter(step => step.type === 'form');

  return (
    <div className="progress-tracker">
      {visibleSteps.map((step, index) => {
        const isCompleted = stepHistory.includes(step.stepId) && step.stepId !== currentStepId;
        const isActive = step.stepId === currentStepId;

        const stepClass = isCompleted
          ? 'step-item--completed'
          : isActive
          ? 'step-item--active'
          : 'step-item--upcoming';

        return (
          <React.Fragment key={step.stepId}>
            <div className={`step-item ${stepClass}`}>
              <div className="step-number">
                {isCompleted ? <Check /> : index + 1}
              </div>
              <div className="step-title">{step.title.replace(/Step \d+: /, '')}</div>
            </div>
            {index < visibleSteps.length - 1 && <div className="step-connector" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressTracker;