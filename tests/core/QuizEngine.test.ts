import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuizEngine, QuizOptions, QuizResult } from '../../src/core/QuizEngine';
import { ContentItem } from '../../src/types';

// モックデータ
const mockContentItem: ContentItem = {
  id: 1,
  text: "猿も木から落ちる",
  reading: "さるもきからおちる",
  meaning: "どんなに得意なことでも、時には失敗することがある",
  difficulty: "小学生",
  example_sentence: "プロの料理人でも失敗することがある。猿も木から落ちるというものだ。",
  type: "proverb",
};

const mockChoices = [
  "どんなに得意なことでも、時には失敗することがある",
  "つらいことでも辛抱して続ければ、いつかは成し遂げられる",
  "危険を冒さなければ大きな成功は得られない",
  "小さなものでも積み重なれば大きなものになる",
];

describe('QuizEngine', () => {
  let quizEngine: QuizEngine;

  beforeEach(() => {
    quizEngine = new QuizEngine();
  });

  describe('generateQuestion', () => {
    it('問題を正しく生成できる', () => {
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices);

      expect(question).toMatchObject({
        id: expect.any(Number),
        question: expect.stringContaining('猿も木から落ちる'),
        choices: expect.arrayContaining(mockChoices),
        correctAnswer: expect.any(Number),
        explanation: expect.stringContaining('猿も木から落ちる'),
        contentItem: mockContentItem,
      });
    });

    it('正解の選択肢インデックスが正しい', () => {
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices);
      const correctChoice = question.choices[question.correctAnswer];
      
      expect(correctChoice).toBe(mockContentItem.meaning);
    });

    it('選択肢をシャッフルできる', () => {
      const options: QuizOptions = { shuffleChoices: true };
      
      // 複数回生成してシャッフルされているか確認
      const orders = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const question = quizEngine.generateQuestion(mockContentItem, [...mockChoices], options);
        orders.add(question.choices.join('|'));
      }
      
      // 少なくとも2つ以上の異なる順序が存在することを期待
      expect(orders.size).toBeGreaterThan(1);
    });

    it('異なる問題タイプを生成できる', () => {
      const options: QuizOptions = { questionType: 'reading' };
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices, options);
      
      expect(question.question).toContain('読み方');
    });

    it('各問題に一意のIDが割り当てられる', () => {
      const question1 = quizEngine.generateQuestion(mockContentItem, mockChoices);
      const question2 = quizEngine.generateQuestion(mockContentItem, mockChoices);
      
      expect(question1.id).not.toBe(question2.id);
      expect(question2.id).toBe(question1.id + 1);
    });
  });

  describe('checkAnswer', () => {
    let questionId: number;

    beforeEach(() => {
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices);
      questionId = question.id;
    });

    it('正解を判定できる', () => {
      const question = quizEngine['activeQuestions'].get(questionId)!;
      const result = quizEngine.checkAnswer(questionId, question.correctAnswer);

      expect(result).toMatchObject({
        questionId,
        isCorrect: true,
        selectedChoice: question.correctAnswer,
        correctAnswer: question.correctAnswer,
        timeSpent: expect.any(Number),
      });
    });

    it('不正解を判定できる', () => {
      const question = quizEngine['activeQuestions'].get(questionId)!;
      const incorrectChoice = (question.correctAnswer + 1) % 4;
      const result = quizEngine.checkAnswer(questionId, incorrectChoice);

      expect(result).toMatchObject({
        questionId,
        isCorrect: false,
        selectedChoice: incorrectChoice,
        correctAnswer: question.correctAnswer,
        timeSpent: expect.any(Number),
      });
    });

    it('存在しない問題IDではエラー結果を返す', () => {
      const result = quizEngine.checkAnswer(999, 0);

      expect(result).toMatchObject({
        questionId: 999,
        isCorrect: false,
        selectedChoice: 0,
        correctAnswer: -1,
      });
    });

    it('回答時間を記録する', async () => {
      // 少し時間を待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = quizEngine.checkAnswer(questionId, 0);
      
      expect(result.timeSpent).toBeGreaterThan(90); // ミリ秒
    });
  });

  describe('統計機能', () => {
    beforeEach(async () => {
      // テスト用の問題と回答を生成
      for (let i = 0; i < 5; i++) {
        const question = quizEngine.generateQuestion(mockContentItem, mockChoices);
        const isCorrect = i < 3; // 3問正解、2問不正解
        const choice = isCorrect ? 
          question.correctAnswer : 
          (question.correctAnswer + 1) % 4;
        
        // 少し時間を待ってから回答（時間計測のため）
        await new Promise(resolve => setTimeout(resolve, 10));
        quizEngine.checkAnswer(question.id, choice);
      }
    });

    it('問題履歴を取得できる', () => {
      const history = quizEngine.getQuestionHistory();
      
      expect(history).toHaveLength(5);
      expect(history.filter(r => r.isCorrect)).toHaveLength(3);
    });

    it('正解率を計算できる', () => {
      const accuracy = quizEngine.getAccuracy();
      
      expect(accuracy).toBe(60); // 3/5 = 60%
    });

    it('平均回答時間を計算できる', () => {
      const avgTime = quizEngine.getAverageResponseTime();
      
      expect(avgTime).toBeGreaterThan(0);
    });

    it('セッション統計を取得できる', () => {
      const stats = quizEngine.getSessionStats();
      
      expect(stats).toMatchObject({
        totalQuestions: 5,
        correctAnswers: 3,
        incorrectAnswers: 2,
        accuracy: 60,
        avgResponseTime: expect.any(Number),
        questionHistory: expect.arrayContaining([
          expect.objectContaining({
            questionId: expect.any(Number),
            isCorrect: expect.any(Boolean),
          }),
        ]),
      });
    });
  });

  describe('getExplanation', () => {
    it('問題の解説を取得できる', () => {
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices);
      const explanation = quizEngine.getExplanation(question.id);

      expect(explanation).toContain('猿も木から落ちる');
      expect(explanation).toContain('さるもきからおちる');
      expect(explanation).toContain('どんなに得意なことでも、時には失敗することがある');
      expect(explanation).toContain('プロの料理人でも失敗することがある');
      expect(explanation).toContain('小学生');
    });

    it('存在しない問題IDではエラーメッセージを返す', () => {
      const explanation = quizEngine.getExplanation(999);
      
      expect(explanation).toBe('問題が見つかりませんでした。');
    });
  });

  describe('問題管理', () => {
    it('個別の問題をクリアできる', () => {
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices);
      
      quizEngine.clearQuestion(question.id);
      
      const explanation = quizEngine.getExplanation(question.id);
      expect(explanation).toBe('問題が見つかりませんでした。');
    });

    it('全ての問題をクリアできる', () => {
      const q1 = quizEngine.generateQuestion(mockContentItem, mockChoices);
      const q2 = quizEngine.generateQuestion(mockContentItem, mockChoices);
      
      quizEngine.clearAllQuestions();
      
      expect(quizEngine.getExplanation(q1.id)).toBe('問題が見つかりませんでした。');
      expect(quizEngine.getExplanation(q2.id)).toBe('問題が見つかりませんでした。');
    });
  });

  describe('retryQuestion', () => {
    it('問題を再挑戦できる', () => {
      const original = quizEngine.generateQuestion(mockContentItem, mockChoices);
      const retry = quizEngine.retryQuestion(original.id);

      expect(retry).not.toBeNull();
      expect(retry!.id).not.toBe(original.id);
      expect(retry!.contentItem).toEqual(original.contentItem);
      expect(retry!.choices).toEqual(original.choices);
    });

    it('存在しない問題の再挑戦はnullを返す', () => {
      const retry = quizEngine.retryQuestion(999);
      
      expect(retry).toBeNull();
    });
  });

  describe('問題タイプ別の処理', () => {
    it('意味を問う問題を生成できる', () => {
      const options: QuizOptions = { questionType: 'meaning' };
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices, options);
      
      expect(question.question).toMatch(/意味|表す/);
    });

    it('読み方を問う問題を生成できる', () => {
      const readingChoices = [
        "さるもきからおちる",
        "いしのうえにもさんねん",
        "こけつにいらずんばこじをえず",
        "ちりもつもればやまとなる",
      ];
      const options: QuizOptions = { questionType: 'reading' };
      const question = quizEngine.generateQuestion(mockContentItem, readingChoices, options);
      
      expect(question.question).toContain('読み方');
    });

    it('例文を問う問題を生成できる', () => {
      const options: QuizOptions = { questionType: 'example' };
      const question = quizEngine.generateQuestion(mockContentItem, mockChoices, options);
      
      expect(question.question).toContain('例文');
    });
  });
});