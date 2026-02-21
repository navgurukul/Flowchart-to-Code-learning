import React from 'react';
import { Lesson } from '../data/lessons';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FlowchartShapesShowcase } from './FlowchartShapes3D';
import { LessonQuiz, QuizQuestion } from './LessonQuiz';

interface LessonViewerProps {
  lesson: Lesson;
  isCompleted: boolean;
  onComplete: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  isCompleted,
  onComplete
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
              <p className="text-gray-600 mt-1">{lesson.description}</p>
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>{lesson.duration}</span>
          <span className="mx-2">•</span>
          <span className="capitalize">{lesson.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-blue max-w-none mb-8">
        {/* Show 3D Flowchart Shapes for flowchart-related lessons */}
        {(lesson.category === 'flowcharts' || lesson.title.toLowerCase().includes('flowchart')) && (
          <div className="mb-8">
            <FlowchartShapesShowcase />
          </div>
        )}
        
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 mt-5 mb-3" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2" {...props} />,
            p: ({node, ...props}) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
            li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
            code: ({node, inline, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : 'javascript';
              
              return inline ? (
                <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="rounded-lg mb-4 text-sm"
                  showLineNumbers={true}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            },
            pre: ({node, ...props}) => <div className="mb-4" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />
          }}
        >
          {lesson.content}
        </ReactMarkdown>
      </div>

      {/* Complete Button or Quiz */}
      {lesson.quiz && lesson.quiz.length > 0 ? (
        <LessonQuiz
          questions={lesson.quiz}
          onComplete={onComplete}
          isCompleted={isCompleted}
        />
      ) : !isCompleted && (
        <div className="flex justify-center pt-6 border-t border-gray-200">
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Mark as Complete
          </button>
        </div>
      )}
    </div>
  );
};
