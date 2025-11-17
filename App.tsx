import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// 輔助函數，檢查是否為質數
const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i = i + 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

// 輔助函數，取得一個數字的所有因數
const getFactors = (num: number): number[] => {
    if (num <= 0) return [];
    const factors = new Set<number>();
    for (let i = 1; i * i <= num; i++) {
        if (num % i === 0) {
            factors.add(i);
            factors.add(num / i);
        }
    }
    return Array.from(factors).sort((a, b) => a - b);
};

// 輔助函數，計算質數數量
const countPrimes = (n: number) => {
    let count = 0;
    for (let i = 1; i <= n; i++) {
        if (isPrime(i)) {
            count++;
        }
    }
    return count;
};

// 輔助函數，格式化時間
const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const ms = Math.floor((milliseconds % 1000) / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
};


const App: React.FC = () => {
    const [clickedStatus, setClickedStatus] = useState<{ [key: number]: boolean }>({});
    const [sidebarNumber, setSidebarNumber] = useState<number | null>(null);

    // 挑戰模式狀態
    const [challengeState, setChallengeState] = useState<'idle' | 'running' | 'completed'>('idle');
    const [challengeLimit, setChallengeLimit] = useState<number | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [foundPrimes, setFoundPrimes] = useState<Set<number>>(new Set());
    const [totalPrimes, setTotalPrimes] = useState<number>(0);
    const timerIntervalRef = useRef<number | null>(null);


    // 開始挑戰
    const handleStartChallenge = useCallback((limit: number) => {
        setChallengeLimit(limit);
        setTotalPrimes(countPrimes(limit));
        setClickedStatus({});
        setSidebarNumber(null);
        setFoundPrimes(new Set());
        setTimer(0);
        setChallengeState('running');
    }, []);

    // 重設/放棄挑戰
    const handleResetChallenge = useCallback(() => {
        setChallengeState('idle');
        setChallengeLimit(null);
        setClickedStatus({});
    }, []);


    // 計時器邏輯
    useEffect(() => {
        if (challengeState === 'running') {
            const startTime = Date.now();
            timerIntervalRef.current = window.setInterval(() => {
                setTimer(Date.now() - startTime);
            }, 100);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
        
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [challengeState]);


    // 處理點擊數字卡的函數
    const handleCardClick = useCallback((num: number) => {
        if (challengeState === 'running' && challengeLimit) {
             if (num > challengeLimit || !isPrime(num) || foundPrimes.has(num)) {
                return; // 挑戰模式下，只對未找出的質數有反應
            }
            const newFoundPrimes = new Set(foundPrimes).add(num);
            setFoundPrimes(newFoundPrimes);
            setClickedStatus(prev => ({...prev, [num]: true}));
            
            if(newFoundPrimes.size === totalPrimes) {
                setChallengeState('completed');
            }

        } else if (challengeState === 'idle') {
            const isNumPrime = isPrime(num);
            setClickedStatus(prevStatus => ({
                ...prevStatus,
                [num]: isNumPrime
            }));
            
            if (!isNumPrime) {
                setSidebarNumber(num);
            } else {
                setSidebarNumber(null);
            }
        }
    }, [challengeState, challengeLimit, foundPrimes, totalPrimes]);

    const handleCloseSidebar = useCallback(() => {
        setSidebarNumber(null);
    }, []);

    const numbers = useMemo(() => {
        const limit = challengeLimit || 1000;
        return Array.from({ length: limit }, (_, i) => i + 1)
    }, [challengeLimit]);

    const getCardClasses = (num: number) => {
        const baseClasses = "w-20 h-20 flex items-center justify-center text-2xl font-bold rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4";
        
        if (num in clickedStatus) {
            return clickedStatus[num] 
                ? `${baseClasses} bg-green-500 text-white ring-green-300/50` 
                : `${baseClasses} bg-red-500 text-white ring-red-300/50`;
        }
        
        return `${baseClasses} bg-slate-800 text-slate-300 hover:bg-slate-700 ring-slate-600/50`;
    };

    const factors = useMemo(() => sidebarNumber ? getFactors(sidebarNumber) : [], [sidebarNumber]);
    
    const challengeButtons = [50, 100, 300];

    return (
        <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center p-4 font-sans antialiased relative overflow-x-hidden">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center my-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-cyan-400">質數點點看</h1>
                    <p className="text-slate-400 mt-2">點一點數字，看看它是不是質數吧！如果是質數會變綠色，不是質數就會變紅色喔！</p>
                </header>

                <section className="bg-slate-950/50 p-4 rounded-xl mb-6 ring-1 ring-slate-700">
                    <h2 className="text-2xl font-bold text-center text-amber-400 mb-4">挑戰模式</h2>
                    {challengeState === 'idle' ? (
                        <div className="flex justify-center gap-4">
                            {challengeButtons.map(limit => (
                                 <button key={limit} onClick={() => handleStartChallenge(limit)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                    {limit} 以內
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="flex justify-center items-center gap-6 mb-4">
                                <div className="text-xl">計時：<span className="font-mono text-3xl text-green-400">{formatTime(timer)}</span></div>
                                <div className="text-xl">已找到：<span className="font-mono text-3xl text-amber-400">{foundPrimes.size} / {totalPrimes}</span></div>
                            </div>
                            <button onClick={handleResetChallenge} className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                放棄挑戰
                            </button>
                        </div>
                    )}
                </section>

                <main className="flex flex-wrap justify-center gap-3 p-4 bg-slate-950/50 rounded-2xl ring-1 ring-slate-700">
                    {numbers.map(num => (
                        <button
                            key={num}
                            onClick={() => handleCardClick(num)}
                            className={getCardClasses(num)}
                            aria-live="polite"
                            aria-label={`數字 ${num}. ${num in clickedStatus ? (clickedStatus[num] ? '是質數' : '不是質數') : '點擊以檢查'}`}
                        >
                            {num}
                        </button>
                    ))}
                </main>
            </div>
            
            {sidebarNumber !== null && (
                <div 
                    className="fixed inset-0 bg-black/60 z-10 transition-opacity duration-300"
                    onClick={handleCloseSidebar}
                    aria-hidden="true"
                ></div>
            )}

            <aside className={`fixed top-0 right-0 h-full w-80 bg-slate-950/80 backdrop-blur-sm shadow-2xl z-20 transform transition-transform duration-300 ease-in-out ${sidebarNumber !== null ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-cyan-400">因數分解</h2>
                        <button onClick={handleCloseSidebar} className="text-slate-400 hover:text-white transition-colors text-3xl leading-none" aria-label="關閉側邊欄">
                            &times;
                        </button>
                    </div>
                    {sidebarNumber !== null && (
                        <div>
                            <p className="text-slate-300 mb-4 text-lg">
                                數字 <span className="font-bold text-3xl text-red-400 mx-1">{sidebarNumber}</span> 不是質數，它的因數有：
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {factors.map(factor => (
                                    <span key={factor} className="bg-slate-700 text-slate-200 font-mono text-lg px-3 py-1 rounded-md">
                                        {factor}
                                    </span>
                                ))}
                            </div>
                            {sidebarNumber === 1 && (
                                <p className="text-slate-300 mt-4 pt-4 border-t border-slate-700">
                                    它只有一個因數（它自己），所以它既不是質數也不是合數。
                                </p>
                            )}
                             {sidebarNumber !== 1 && (
                                <p className="text-slate-300 mt-4 pt-4 border-t border-slate-700">
                                    質數的定義是在大於 1 的自然數中，除了 1 和該數自身外，無法被其他自然數整除的數（也可定義為只有 1 與該數本身兩個正因數的數）。
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </aside>
            
            {/* Completion Modal */}
            {challengeState === 'completed' && challengeLimit && (
                 <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4">
                     <div className="bg-slate-800 rounded-2xl p-8 text-center ring-1 ring-cyan-500/50 shadow-2xl max-w-sm w-full">
                        <h2 className="text-3xl font-bold text-amber-400 mb-2">挑戰完成！</h2>
                        <p className="text-slate-300 mb-4">恭喜您找到了 {challengeLimit} 以內的所有質數！</p>
                        <div className="bg-slate-900 rounded-lg p-4 mb-6">
                            <p className="text-slate-400 text-sm">您的成績</p>
                            <p className="font-mono text-4xl text-green-400">{formatTime(timer)}</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleStartChallenge(challengeLimit)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">再玩一次</button>
                            <button onClick={handleResetChallenge} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">選擇新挑戰</button>
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default App;
