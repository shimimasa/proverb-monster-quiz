import type { ContentItem, QuizQuestion, ContentType } from '@types/index';

export interface QuizOptions {
  questionType?: 'meaning' | 'reading' | 'example';
  shuffleChoices?: boolean;
  timeLimit?: number;
}

export interface QuizResult {
  questionId: number;
  isCorrect: boolean;
  selectedChoice: number;
  correctAnswer: number;
  timeSpent?: number;
}

export class QuizEngine {
  private questionCounter = 0;
  private activeQuestions: Map<number, QuizQuestion> = new Map();
  private questionHistory: Map<number, QuizResult> = new Map();
  private questionStartTime: Map<number, number> = new Map();

  generateQuestion(
    contentItem: ContentItem, 
    choices: string[], 
    options: QuizOptions = {}
  ): QuizQuestion {
    const questionId = ++this.questionCounter;
    const { questionType = 'meaning', shuffleChoices = true } = options;
    
    // 問題タイプに応じて選択肢を調整
    const processedChoices = this.processChoices(
      contentItem,
      choices,
      questionType,
      shuffleChoices
    );
    
    const correctAnswerIndex = this.findCorrectAnswerIndex(
      contentItem,
      processedChoices,
      questionType
    );
    
    const question: QuizQuestion = {
      id: questionId,
      question: this.createQuestionText(contentItem, questionType),
      choices: processedChoices,
      correctAnswer: correctAnswerIndex,
      explanation: this.createExplanation(contentItem),
      contentItem,
    };

    this.activeQuestions.set(questionId, question);
    this.questionStartTime.set(questionId, Date.now());
    return question;
  }

  checkAnswer(questionId: number, selectedChoice: number): QuizResult {
    const question = this.activeQuestions.get(questionId);
    if (!question) {
      console.error(`Question ${questionId} not found`);
      return {
        questionId,
        isCorrect: false,
        selectedChoice,
        correctAnswer: -1,
      };
    }

    const startTime = this.questionStartTime.get(questionId);
    const timeSpent = startTime ? Date.now() - startTime : undefined;
    
    const isCorrect = selectedChoice === question.correctAnswer;
    const result: QuizResult = {
      questionId,
      isCorrect,
      selectedChoice,
      correctAnswer: question.correctAnswer,
      timeSpent,
    };
    
    this.questionHistory.set(questionId, result);
    return result;
  }

  getExplanation(questionId: number): string {
    const question = this.activeQuestions.get(questionId);
    if (!question) {
      return '問題が見つかりませんでした。';
    }

    return question.explanation;
  }

  clearQuestion(questionId: number): void {
    this.activeQuestions.delete(questionId);
  }

  clearAllQuestions(): void {
    this.activeQuestions.clear();
  }

  // 問題履歴の取得
  getQuestionHistory(): QuizResult[] {
    return Array.from(this.questionHistory.values());
  }

  // 正解率の計算
  getAccuracy(): number {
    const history = this.getQuestionHistory();
    if (history.length === 0) return 0;
    
    const correctCount = history.filter(r => r.isCorrect).length;
    return (correctCount / history.length) * 100;
  }

  // 平均回答時間の計算
  getAverageResponseTime(): number {
    const history = this.getQuestionHistory();
    const timesWithData = history.filter(r => r.timeSpent !== undefined);
    
    if (timesWithData.length === 0) return 0;
    
    const totalTime = timesWithData.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    return totalTime / timesWithData.length;
  }

  private processChoices(
    contentItem: ContentItem,
    choices: string[],
    questionType: 'meaning' | 'reading' | 'example',
    shuffle: boolean
  ): string[] {
    // 問題タイプに応じて選択肢を変換
    let processedChoices = [...choices];
    
    if (questionType === 'reading') {
      // 読み方を問う問題の場合、選択肢も読み方にする必要がある
      // この実装は ContentManager と連携して行う
    }
    
    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = processedChoices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [processedChoices[i], processedChoices[j]] = [processedChoices[j], processedChoices[i]];
      }
    }
    
    return processedChoices;
  }

  private findCorrectAnswerIndex(
    contentItem: ContentItem,
    choices: string[],
    questionType: 'meaning' | 'reading' | 'example'
  ): number {
    let correctAnswer: string;
    
    switch (questionType) {
      case 'meaning':
        correctAnswer = contentItem.meaning;
        break;
      case 'reading':
        correctAnswer = contentItem.reading;
        break;
      case 'example':
        correctAnswer = contentItem.example_sentence || contentItem.meaning;
        break;
      default:
        correctAnswer = contentItem.meaning;
    }
    
    return choices.indexOf(correctAnswer);
  }

  private createQuestionText(contentItem: ContentItem, questionType: 'meaning' | 'reading' | 'example' = 'meaning'): string {
    const typeText = contentItem.type === 'proverb' ? 'ことわざ' :
                     contentItem.type === 'idiom' ? '慣用句' :
                     contentItem.type === 'four_character_idiom' ? '四字熟語' : '';
    
    switch (questionType) {
      case 'meaning':
        const meaningTemplates = [
          `「${contentItem.text}」の意味は？`,
          `次の${typeText}の意味を選んでください：\n「${contentItem.text}」`,
          `「${contentItem.text}」\nこの${typeText}が表す意味は何でしょう？`,
        ];
        return meaningTemplates[Math.floor(Math.random() * meaningTemplates.length)];
        
      case 'reading':
        return `「${contentItem.text}」の読み方は？`;
        
      case 'example':
        return `「${contentItem.text}」を使った例文として正しいものは？`;
        
      default:
        return `「${contentItem.text}」の意味は？`;
    }
  }

  private createExplanation(contentItem: ContentItem): string {
    const typeText = contentItem.type === 'proverb' ? 'ことわざ' :
                     contentItem.type === 'idiom' ? '慣用句' :
                     contentItem.type === 'four_character_idiom' ? '四字熟語' : '';
    
    let explanation = `【${typeText}】${contentItem.text}（${contentItem.reading}）\n\n` +
                      `📖 意味：${contentItem.meaning}\n\n`;
    
    if (contentItem.example_sentence) {
      explanation += `💡 例文：${contentItem.example_sentence}\n\n`;
    }
    
    explanation += `📊 難易度：${contentItem.difficulty}`;
    
    return explanation;
  }

  // セッション統計の取得
  getSessionStats() {
    const history = this.getQuestionHistory();
    const correctAnswers = history.filter(r => r.isCorrect).length;
    const totalQuestions = history.length;
    const accuracy = this.getAccuracy();
    const avgResponseTime = this.getAverageResponseTime();
    
    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      accuracy,
      avgResponseTime,
      questionHistory: history,
    };
  }

  // 問題の再挑戦機能
  retryQuestion(questionId: number): QuizQuestion | null {
    const originalQuestion = this.activeQuestions.get(questionId);
    if (!originalQuestion) {
      return null;
    }
    
    // 新しいIDで問題を再生成
    const newQuestionId = ++this.questionCounter;
    const retryQuestion: QuizQuestion = {
      ...originalQuestion,
      id: newQuestionId,
    };
    
    this.activeQuestions.set(newQuestionId, retryQuestion);
    this.questionStartTime.set(newQuestionId, Date.now());
    
    return retryQuestion;
  }
}