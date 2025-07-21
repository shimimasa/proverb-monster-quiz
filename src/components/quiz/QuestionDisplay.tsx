import React from 'react';
import type { QuizQuestion } from '@types/index';

interface QuestionDisplayProps {
  question: QuizQuestion;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          問題
        </h2>
        <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-line">
          {question.question}
        </p>
      </div>
    </div>
  );
};