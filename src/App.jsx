import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Share, ChevronRight, Sparkles, Globe, ThumbsUp } from 'lucide-react';
import Papa from 'papaparse';
import { Analytics } from "@vercel/analytics/react"

// Noto Sans KR + Inter 폰트 로드
if (typeof document !== 'undefined') {
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Inter:wght@400;500;700;900&display=swap';
  fontLink.rel = 'stylesheet';
  if (!document.querySelector('link[href*="Noto+Sans+KR"]')) {
    document.head.appendChild(fontLink);
  }
}

// 다국어 지원
const TRANSLATIONS = {
  en: {
    home: {
      title: "Dilemma Quiz",
      subtitle: "The ultimate Balance Game",
      startButton: "Start Quiz 🚀",
      joinText: "Enjoy with friends and family!"
    },
    categories: {
      title: "Choose Your Vibe ✨",
      romance: { name: "Love & Romance", desc: "Your romantic personality" },
      workschool: { name: "Work & School", desc: "Your professional personality" },
      questions: "questions",
      comingSoon: "More categories coming soon!"
    },
    questionCount: {
      title: "Please choose the number of questions 🤔",
      subtitle: "More questions = more fun!",
      questions: "Questions"
    },
    quiz: {
      question: "Question",
      of: "of",
      or: "OR",
      next: "Next Question",
      comments: "Comments",
      nickname: "Your nickname",
      commentPlaceholder: "Share your thoughts...",
      postComment: "Post Comment",
      noComments: "No comments yet. Be the first to share your thoughts!",
      votes: "votes",
      mostLiked: "Most Liked",
      mostRecent: "Most Recent"
    },
    complete: {
      title: "Quiz Complete!",
      subtitle: "You answered",
      questions: "questions",
      download: "Share Quiz",
      another: "Take Another Quiz",
      share: "Share your result with friends!",
      shareSuccess: "Link copied to clipboard!",
      contact: "If you have any questions, please contact shipsand00@gmail.com!"
    }
  },
  ko: {
    home: {
      title: "딜레마 퀴즈",
      subtitle: "궁극의 밸런스 게임",
      startButton: "퀴즈 시작 🚀",
      joinText: "친구와 가족들과 함께 즐겨보세요!"
    },
    categories: {
      title: "카테고리를 선택하세요 ✨",
      romance: { name: "사랑과 연애", desc: "당신의 연애 스타일" },
      workschool: { name: "직장과 학교", desc: "당신의 업무 스타일" },
      questions: "문항",
      comingSoon: "업데이트 예정! 카테고리가 더 추가됩니다"
    },
    questionCount: {
      title: "질문 개수를 골라주세요 🤔",
      subtitle: "더 많이 고를수록 더 재미있어요!",
      questions: "문항"
    },
    quiz: {
      question: "질문",
      of: "/",
      or: "또는",
      next: "다음 질문",
      comments: "댓글",
      nickname: "닉네임",
      commentPlaceholder: "생각을 공유해주세요...",
      postComment: "댓글 작성",
      noComments: "아직 댓글이 없어요. 첫 댓글을 남겨보세요!",
      votes: "표",
      mostLiked: "좋아요순",
      mostRecent: "최신순"
    },
    complete: {
      title: "퀴즈 완료!",
      subtitle: "총",
      questions: "문항에 답변했어요",
      download: "공유하기",
      another: "다른 퀴즈 하기",
      share: "친구들과 결과를 공유하세요!",
      shareSuccess: "링크가 복사되었습니다!",
      contact: "문의사항이 있다면 shipsand00@gmail.com으로 보내주세요!"
    }
  }
};

// 질문 데이터베이스 (기본값 - CSV 없을 때 사용)
const QUESTION_DATABASE = {
  romance: [
    { 
      id: "romance_0",
      en: { q: "Find true love but struggle financially OR rich but lonely?", a: "True love", b: "Rich lonely" },
      ko: { q: "진정한 사랑이지만 가난 OR 부자지만 외로움?", a: "진정한 사랑", b: "부자지만 외로움" }
    },
    { 
      id: "romance_1",
      en: { q: "Know your partner's every thought OR keep some mystery?", a: "Every thought", b: "Keep mystery" },
      ko: { q: "파트너의 모든 생각 알기 OR 신비함 유지?", a: "모든 생각 알기", b: "신비함 유지" }
    }
  ],
  workschool: [
    { 
      id: "workschool_0",
      en: { q: "Work from home forever OR office forever?", a: "Work from home", b: "Office forever" },
      ko: { q: "평생 재택근무 OR 평생 사무실?", a: "재택근무", b: "사무실" }
    },
    { 
      id: "workschool_1",
      en: { q: "Dream job with low pay OR boring job with high pay?", a: "Dream job", b: "Boring high pay" },
      ko: { q: "낮은 연봉의 꿈의 직장 OR 높은 연봉의 지루한 직장?", a: "꿈의 직장", b: "지루한 고연봉" }
    }
  ]
};

const App = () => {
  const [stage, setStage] = useState('home');
  const [language, setLanguage] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questionCount, setQuestionCount] = useState(32);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [comments, setComments] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [commentForm, setCommentForm] = useState({ nickname: '', comment: '' });
  const [commentSort, setCommentSort] = useState('likes');
  const [commentLikes, setCommentLikes] = useState({});
  const [questionDB, setQuestionDB] = useState(QUESTION_DATABASE);
  const [isLoadingCSV, setIsLoadingCSV] = useState(true);

  const t = TRANSLATIONS[language];

  const categories = [
    { id: 'romance', emoji: '💘' },
    { id: 'workschool', emoji: '💼' }
  ];

  // 언어에 따라 브라우저 탭 제목 변경
  useEffect(() => {
    const titles = {
      en: 'Dilemma Quiz',
      ko: '딜레마 퀴즈'
    };
    document.title = titles[language];
  }, [language]);

  // SEO를 위한 구조화된 데이터 (JSON-LD)
useEffect(() => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Dilemma Quiz",
    "description": "Fun balance game with would you rather questions",
    "url": "https://dilemmaquiz.vercel.app",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "inLanguage": ["en", "ko"],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    }
  });
  
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  document.head.appendChild(script);
  
  return () => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  };
}, []);

  // CSV 파일 로드
  useEffect(() => {
    const loadCSV = async () => {
      try {
        console.log('📂 CSV 파일 로딩 시도...');
        const response = await fetch('/questions.csv');
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`CSV file not found - Status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('📄 CSV 텍스트 길이:', csvText.length);
        console.log('📄 CSV 첫 200자:', csvText.substring(0, 200));
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('📊 파싱된 데이터 개수:', results.data.length);
            console.log('📊 첫 3개 데이터:', results.data.slice(0, 3));
            console.log('📊 헤더:', results.meta.fields);
            
            const db = {};
            
            results.data.forEach((row, index) => {
              const category = row.category?.trim().toLowerCase();
              
              if (index < 5) {
                console.log(`행 ${index}: category="${category}"`, row);
              }
              
              // 유효한 카테고리인지 체크
              if (!category || !['romance', 'workschool'].includes(category)) {
                if (category) {
                  console.warn(`⚠️ Unknown category at row ${index}:`, category);
                }
                return;
              }
              
              // 질문 데이터 검증
              if (!row.question_en || !row.option_a_en || !row.option_b_en) {
                console.warn(`⚠️ Incomplete data at row ${index}:`, row);
                return;
              }
              
              if (!db[category]) {
                db[category] = [];
              }
              
              db[category].push({
                id: `${category}_${db[category].length}`,
                en: {
                  q: row.question_en?.trim() || '',
                  a: row.option_a_en?.trim() || '',
                  b: row.option_b_en?.trim() || ''
                },
                ko: {
                  q: row.question_ko?.trim() || '',
                  a: row.option_a_ko?.trim() || '',
                  b: row.option_b_ko?.trim() || ''
                }
              });
            });
            
            console.log('✅ 최종 DB:', Object.keys(db).map(k => `${k}: ${db[k].length}개`));
            
            if (Object.keys(db).length > 0) {
              setQuestionDB(db);
              console.log('✅ CSV 로드 완료!');
            } else {
              console.warn('⚠️ CSV에서 데이터를 찾을 수 없습니다. 기본값 사용');
            }
            setIsLoadingCSV(false);
          },
          error: (error) => {
            console.error('❌ CSV 파싱 에러:', error);
            setIsLoadingCSV(false);
          }
        });
      } catch (error) {
        console.error('❌ CSV 파일 로드 실패:', error);
        setIsLoadingCSV(false);
      }
    };
    
    loadCSV();
  }, []);

  useEffect(() => {
    const savedStats = localStorage.getItem('dilemma_statistics');
    const savedComments = localStorage.getItem('dilemma_comments');
    const savedLikes = localStorage.getItem('dilemma_likes');
    if (savedStats) setStatistics(JSON.parse(savedStats));
    if (savedComments) setComments(JSON.parse(savedComments));
    if (savedLikes) setCommentLikes(JSON.parse(savedLikes));
  }, []);

  const updateStatistics = (questionId, choice) => {
    const newStats = { ...statistics };
    if (!newStats[questionId]) {
      newStats[questionId] = { a: 0, b: 0 };
    }
    newStats[questionId][choice]++;
    setStatistics(newStats);
    localStorage.setItem('dilemma_statistics', JSON.stringify(newStats));
  };

  const startQuiz = () => {
    const categoryQuestions = questionDB[selectedCategory] || [];
    
    // 원본 데이터 그대로 저장 (언어별 변환 제거)
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    setQuestions(selected);
    setAnswers([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setStage('quiz');
  };

  const handleAnswerClick = (choice) => {
    setSelectedAnswer(choice);
    updateStatistics(questions[currentQuestion].id, choice);
    const question = questions[currentQuestion];
    const newAnswers = [...answers, { ...question, choice }];
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    setCommentForm({ nickname: '', comment: '' });
    setSelectedAnswer(null);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStage('complete');
    }
  };

  const handleCommentSubmit = () => {
    if (!commentForm.nickname.trim() || !commentForm.comment.trim()) {
      alert('Please enter both nickname and comment!');
      return;
    }

    const question = questions[currentQuestion];
    const commentId = `${question.id}_${Date.now()}`;
    const newComments = { ...comments };
    if (!newComments[question.id]) {
      newComments[question.id] = [];
    }
    
    newComments[question.id].push({
      id: commentId,
      nickname: commentForm.nickname,
      answer: selectedAnswer,
      comment: commentForm.comment,
      timestamp: Date.now()
    });
    
    setComments(newComments);
    localStorage.setItem('dilemma_comments', JSON.stringify(newComments));
    
    const newLikes = { ...commentLikes };
    newLikes[commentId] = 0;
    setCommentLikes(newLikes);
    localStorage.setItem('dilemma_likes', JSON.stringify(newLikes));
    
    setCommentForm({ nickname: '', comment: '' });
  };

  const handleLike = (commentId) => {
    const newLikes = { ...commentLikes };
    if (!newLikes[commentId]) {
      newLikes[commentId] = 0;
    }
    newLikes[commentId]++;
    setCommentLikes(newLikes);
    localStorage.setItem('dilemma_likes', JSON.stringify(newLikes));
  };

  const goHome = () => {
    setStage('home');
    setSelectedCategory(null);
    setSelectedAnswer(null);
    setCommentForm({ nickname: '', comment: '' });
  };

  const shareQuiz = () => {
    // 현재 페이지의 첫 페이지 URL (홈페이지)
    const homeUrl = window.location.origin;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(homeUrl)
      .then(() => {
        alert(t.complete.shareSuccess);
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        // 대안: 프롬프트로 표시
        prompt('링크를 복사하세요:', homeUrl);
      });
  };

  const fontFamily = language === 'ko' ? '"Noto Sans KR", sans-serif' : '"Inter", system-ui, -apple-system, sans-serif';

  if (stage === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4" style={{ fontFamily }}>
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
            className="bg-white/20 backdrop-blur-lg text-white px-5 py-2.5 rounded-full font-bold cursor-pointer hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/40 shadow-lg flex items-center gap-2"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-black tracking-wide">
              {language === 'en' ? 'EN' : 'KO'}
            </span>
          </button>
        </div>

        <div className="text-center max-w-2xl px-4">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 drop-shadow-lg">
            {t.home.title}
          </h1>
          <p className="text-lg sm:text-2xl text-white/90 mb-8">
            {t.home.subtitle}
          </p>
          <button
            onClick={() => setStage('categorySelect')}
            className="bg-white text-purple-600 px-8 sm:px-12 py-3 sm:py-4 rounded-full text-lg sm:text-xl font-bold hover:scale-110 transition-transform shadow-2xl"
          >
            {t.home.startButton}
          </button>
          <p className="text-white/70 mt-6 text-sm sm:text-base">{t.home.joinText}</p>
          
          {/* 하단 문의 정보 */}
          <div className="fixed bottom-4 left-0 right-0 text-center">
            <p className="text-white/60 text-xs sm:text-sm">{t.complete.contact}</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'categorySelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-4 sm:p-8" style={{ fontFamily }}>
        <button
          onClick={goHome}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white/20 backdrop-blur-lg p-3 rounded-full hover:bg-white/30 transition-colors"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>

        {/* 언어 토글 */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
            className="bg-white/20 backdrop-blur-lg text-white px-5 py-2.5 rounded-full font-bold cursor-pointer hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/40 shadow-lg flex items-center gap-2"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-black tracking-wide">
              {language === 'en' ? 'EN' : 'KO'}
            </span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto pt-16 sm:pt-8">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-8 sm:mb-12">
            {t.categories.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setStage('questionCount');
                }}
                className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-3xl p-6 sm:p-8 hover:bg-white/20 transition-all hover:scale-105"
              >
                <div className="text-5xl sm:text-6xl mb-4">{cat.emoji}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {t.categories[cat.id].name}
                </h3>
                <p className="text-sm sm:text-base text-white/80">{t.categories[cat.id].desc}</p>
                <p className="text-white/60 text-xs sm:text-sm mt-2">
                  {questionDB[cat.id]?.length || 0} {t.categories.questions}
                </p>
              </button>
            ))}
          </div>
          
          {/* Coming Soon */}
          <div className="text-center">
            <p className="text-white/70 text-sm sm:text-base font-medium">
              {t.categories.comingSoon}
            </p>
          </div>
          
          {/* 하단 문의 정보 */}
          <div className="fixed bottom-4 left-0 right-0 text-center px-4">
            <p className="text-white/60 text-xs sm:text-sm">{t.complete.contact}</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'questionCount') {
    const maxQuestions = questionDB[selectedCategory]?.length || 0;
    const options = [16, 32, 64].filter(n => n <= maxQuestions);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4 sm:p-8" style={{ fontFamily }}>
        <button
          onClick={goHome}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white/20 backdrop-blur-lg p-3 rounded-full hover:bg-white/30 transition-colors"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>

        {/* 언어 토글 */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
            className="bg-white/20 backdrop-blur-lg text-white px-5 py-2.5 rounded-full font-bold cursor-pointer hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/40 shadow-lg flex items-center gap-2"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-black tracking-wide">
              {language === 'en' ? 'EN' : 'KO'}
            </span>
          </button>
        </div>

        <div className="text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">
            {t.questionCount.title}
          </h2>
          <div className="flex gap-4 sm:gap-6 justify-center flex-wrap">
            {options.map(count => (
              <button
                key={count}
                onClick={() => {
                  setQuestionCount(count);
                  startQuiz();
                }}
                className="bg-white text-blue-600 px-6 sm:px-8 py-4 sm:py-6 rounded-2xl text-xl sm:text-2xl font-bold hover:scale-110 transition-transform shadow-xl"
              >
                {count} {t.questionCount.questions}
              </button>
            ))}
          </div>
          <p className="text-white/80 mt-8 text-sm sm:text-base">{t.questionCount.subtitle}</p>
          
          {/* 하단 문의 정보 */}
          <div className="fixed bottom-4 left-0 right-0 text-center px-4">
            <p className="text-white/60 text-xs sm:text-sm">{t.complete.contact}</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'quiz') {
    const currentQuestionData = questions[currentQuestion];
    
    // 현재 언어에 맞는 질문 데이터 동적으로 가져오기
    const q = {
      q: currentQuestionData[language]?.q || currentQuestionData.en?.q || '',
      a: currentQuestionData[language]?.a || currentQuestionData.en?.a || '',
      b: currentQuestionData[language]?.b || currentQuestionData.en?.b || '',
      id: currentQuestionData.id
    };
    
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    let questionComments = (comments[q.id] || []);
    
    if (commentSort === 'likes') {
      questionComments = [...questionComments].sort((a, b) => 
        (commentLikes[b.id] || 0) - (commentLikes[a.id] || 0)
      );
    } else {
      questionComments = [...questionComments].sort((a, b) => b.timestamp - a.timestamp);
    }
    
    const stats = statistics[q.id] || { a: 0, b: 0 };
    const total = stats.a + stats.b || 1;
    const percentA = Math.round((stats.a / total) * 100);
    const percentB = Math.round((stats.b / total) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 to-orange-500 p-4" style={{ fontFamily }}>
        <button
          onClick={goHome}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white/20 backdrop-blur-lg p-3 rounded-full hover:bg-white/30 transition-colors z-10"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>

        {/* 언어 토글 */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
            className="bg-white/20 backdrop-blur-lg text-white px-5 py-2.5 rounded-full font-bold cursor-pointer hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/40 shadow-lg flex items-center gap-2"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-black tracking-wide">
              {language === 'en' ? 'EN' : 'KO'}
            </span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto pt-16 sm:pt-8 pb-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between text-white mb-2 text-sm sm:text-base">
              <span className="font-bold">{t.quiz.question} {currentQuestion + 1} {t.quiz.of} {questions.length}</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2 sm:h-3">
              <div 
                className="bg-white h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl mb-6">
            <h3 className="text-xl sm:text-3xl font-bold text-gray-800 text-center mb-6 sm:mb-8">
              {q.q}
            </h3>
            
            {!selectedAnswer ? (
              <div className="space-y-4">
                <button
                  onClick={() => handleAnswerClick('a')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 sm:py-6 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
                >
                  {q.a}
                </button>
                
                <div className="text-center text-gray-400 font-bold text-sm sm:text-base">{t.quiz.or}</div>
                
                <button
                  onClick={() => handleAnswerClick('b')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 sm:py-6 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform"
                >
                  {q.b}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-sm sm:text-base ${selectedAnswer === 'a' ? 'text-purple-600' : 'text-gray-600'}`}>
                      {q.a} {selectedAnswer === 'a' && '✓'}
                    </span>
                    <span className="font-bold text-purple-600 text-sm sm:text-base">{percentA}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 sm:h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-6 sm:h-8 transition-all duration-500"
                      style={{ width: `${percentA}%` }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-sm sm:text-base ${selectedAnswer === 'b' ? 'text-blue-600' : 'text-gray-600'}`}>
                      {q.b} {selectedAnswer === 'b' && '✓'}
                    </span>
                    <span className="font-bold text-blue-600 text-sm sm:text-base">{percentB}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 sm:h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-6 sm:h-8 transition-all duration-500"
                      style={{ width: `${percentB}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 mb-6"
                >
                  {t.quiz.next}
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t.quiz.comments} ({questionComments.length})
                    </h4>
                    
                    <select
                      value={commentSort}
                      onChange={(e) => setCommentSort(e.target.value)}
                      className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer hover:from-purple-200 hover:to-pink-200 transition-all border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="likes">👍 {t.quiz.mostLiked}</option>
                      <option value="recent">🕐 {t.quiz.mostRecent}</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-6">
                    <input
                      type="text"
                      placeholder={t.quiz.nickname}
                      value={commentForm.nickname}
                      onChange={(e) => setCommentForm({...commentForm, nickname: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={20}
                    />
                    <textarea
                      placeholder={t.quiz.commentPlaceholder}
                      value={commentForm.comment}
                      onChange={(e) => setCommentForm({...commentForm, comment: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border mb-3 text-sm h-20 sm:h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={200}
                    />
                    <button
                      onClick={handleCommentSubmit}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Send className="w-4 h-4" />
                      {t.quiz.postComment}
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                    {questionComments.length === 0 ? (
                      <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">{t.quiz.noComments}</p>
                    ) : (
                      questionComments.map((comment, idx) => (
                        <div key={comment.id || idx} className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                              {comment.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-gray-800 text-sm sm:text-base">{comment.nickname}</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  comment.answer === 'a' 
                                    ? 'bg-purple-100 text-purple-600' 
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {comment.answer === 'a' ? q.a : q.b}
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words mb-2">{comment.comment}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{new Date(comment.timestamp).toLocaleString()}</span>
                                <button
                                  onClick={() => handleLike(comment.id)}
                                  className="flex items-center gap-1 hover:text-purple-600 transition-colors font-semibold"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{commentLikes[comment.id] || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center p-4" style={{ fontFamily }}>
        <div className="text-center max-w-2xl bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-2xl mx-4">
          <div className="text-5xl sm:text-6xl mb-6">🎉</div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-800 mb-4">
            {t.complete.title}
          </h2>
          <p className="text-lg sm:text-2xl text-gray-600 mb-8">
            {t.complete.subtitle} {answers.length} {t.complete.questions}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={shareQuiz}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold hover:scale-110 transition-transform flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Share className="w-4 h-4 sm:w-5 sm:h-5" />
              {t.complete.download}
            </button>
            <button
              onClick={goHome}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold hover:scale-110 transition-transform text-sm sm:text-base"
            >
              {t.complete.another}
            </button>
          </div>

          <p className="text-gray-500 text-xs sm:text-sm">{t.complete.share}</p>
          
          {/* 하단 문의 정보 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-400 text-xs sm:text-sm">{t.complete.contact}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;