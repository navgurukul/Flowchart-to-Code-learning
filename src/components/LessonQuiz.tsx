import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface QuizQuestion {
  id: number;
  question: string;
  type: 'multiple-choice' | 'fill-blank' | 'true-false';
  options?: string[]; // For multiple choice
  correctAnswer: string | number; // Answer text or index
  explanation?: string;
}

interface LessonQuizProps {
  questions: QuizQuestion[];
  onComplete: () => void;
  isCompleted: boolean;
}

export const LessonQuiz: React.FC<LessonQuizProps> = ({
  questions,
  onComplete,
  isCompleted
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    
    questions.forEach(q => {
      const userAnswer = answers[q.id]?.trim().toLowerCase();
      const correctAnswer = typeof q.correctAnswer === 'number' 
        ? q.options?.[q.correctAnswer]?.toLowerCase()
        : q.correctAnswer.toString().toLowerCase();
      
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    // If all correct, mark as complete
    if (correctCount === questions.length) {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const isAnswerCorrect = (questionId: number): boolean => {
    const userAnswer = answers[questionId]?.trim().toLowerCase();
    const question = questions.find(q => q.id === questionId);
    if (!question) return false;

    const correctAnswer = typeof question.correctAnswer === 'number'
      ? question.options?.[question.correctAnswer]?.toLowerCase()
      : question.correctAnswer.toString().toLowerCase();

    return userAnswer === correctAnswer;
  };

  const allAnswered = questions.every(q => answers[q.id]?.trim());
  const passedQuiz = submitted && score === questions.length;

  if (isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-900 mb-2">
          Lesson Completed! 🎉
        </h3>
        <p className="text-green-700">
          You've mastered this lesson. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
      <div className="flex items-center mb-4">
        <AlertCircle className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-bold text-blue-900">
          Quick Check: Test Your Understanding
        </h3>
      </div>
      
      <p className="text-blue-700 mb-6 text-sm">
        Answer these questions to complete the lesson and move forward.
      </p>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`bg-white rounded-lg p-4 border-2 ${
              submitted
                ? isAnswerCorrect(question.id)
                  ? 'border-green-500'
                  : 'border-red-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start mb-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                {index + 1}
              </span>
              <p className="text-gray-900 font-medium flex-1">{question.question}</p>
              {submitted && (
                <div className="ml-2">
                  {isAnswerCorrect(question.id) ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              )}
            </div>

            {question.type === 'multiple-choice' && question.options && (
              <div className="space-y-2 ml-9">
                {question.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      submitted
                        ? optIndex === question.correctAnswer
                          ? 'bg-green-50 border-green-500'
                          : answers[question.id] === option
                          ? 'bg-red-50 border-red-500'
                          : 'bg-gray-50 border-gray-200'
                        : answers[question.id] === option
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={submitted}
                      className="mr-3"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'fill-blank' && (
              <div className="ml-9">
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={submitted}
                  placeholder="Type your answer here..."
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                    submitted
                      ? isAnswerCorrect(question.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              </div>
            )}

            {question.type === 'true-false' && (
              <div className="flex space-x-4 ml-9">
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors flex-1 ${
                      submitted
                        ? option === question.correctAnswer
                          ? 'bg-green-50 border-green-500'
                          : answers[question.id] === option
                          ? 'bg-red-50 border-red-500'
                          : 'bg-gray-50 border-gray-200'
                        : answers[question.id] === option
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={submitted}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {submitted && question.explanation && !isAnswerCorrect(question.id) && (
              <div className="mt-3 ml-9 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {submitted && (
        <div className={`mt-6 p-4 rounded-lg ${
          passedQuiz ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold ${passedQuiz ? 'text-green-900' : 'text-yellow-900'}`}>
                Score: {score} / {questions.length}
              </p>
              <p className={`text-sm ${passedQuiz ? 'text-green-700' : 'text-yellow-700'}`}>
                {passedQuiz
                  ? '🎉 Perfect! Lesson completed!'
                  : '📚 Review the incorrect answers and try again.'}
              </p>
            </div>
            {!passedQuiz && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {!submitted && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              allAnswered
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Answers
          </button>
        </div>
      )}
    </div>
  );
};
