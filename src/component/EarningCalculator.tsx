import { useEffect, useState } from "react";
import { Clock, DollarSign, Play, Pause, RotateCcw, Sun, Moon, Coffee } from "lucide-react";
import { WriteTimeLog } from "./SavetoFile";
import { invoke } from "@tauri-apps/api/core";

invoke("plugin:theme|set_theme", {
  theme: "dark",
});

declare global {
  interface Window {
    handleStartStop: () => void;
  }
}

const EarningsCalculator = () => {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [breakTime, setBreakTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [totalTime, setTotalTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [totalBreakTime, setTotalBreakTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [hourlyRate, setHourlyRate] = useState(5.775);
  const [earnings, setEarnings] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);


  useEffect(() => {

    let intervalId;

    window.handleStartStop = () => {
      if (!isRunning) {
        setTime({ hours: 0, minutes: 0, seconds: 0 });
        setIsRunning(true);
        setIsOnBreak(false);
      }
      if (isRunning) {
        handlePause();
      }


    };

    if (isRunning && !isOnBreak) {
      intervalId = setInterval(() => {
        setTime(prevTime => {
          const newSeconds = prevTime.seconds + 1;
          const newMinutes = prevTime.minutes + Math.floor(newSeconds / 60);
          const newHours = prevTime.hours + Math.floor(newMinutes / 60);

          const newTime = {
            hours: newHours,
            minutes: newMinutes % 60,
            seconds: newSeconds % 60
          };

          const currentSeconds = newTime.hours * 3600 + newTime.minutes * 60 + newTime.seconds;
          const previousSeconds = totalTime.hours * 3600 + totalTime.minutes * 60 + totalTime.seconds;
          const totalSeconds = currentSeconds + previousSeconds;

          setEarnings(Number((hourlyRate * totalSeconds / 3600).toFixed(2)));

          return newTime;
        });
      }, 1000);
    } else if (isRunning && isOnBreak) {
      intervalId = setInterval(() => {
        setBreakTime(prevTime => {
          const newSeconds = prevTime.seconds + 1;
          const newMinutes = prevTime.minutes + Math.floor(newSeconds / 60);
          const newHours = prevTime.hours + Math.floor(newMinutes / 60);

          return {
            hours: newHours,
            minutes: newMinutes % 60,
            seconds: newSeconds % 60
          };
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, isOnBreak, time, hourlyRate, totalTime, earnings]);

  const handleStart = (e) => {
    e.preventDefault();
    setTime({ hours: 0, minutes: 0, seconds: 0 });
    setIsRunning(true);
    setIsOnBreak(false);
  };

  const handlePause = async () => {
    setIsRunning(false);
    if (time.hours > 0 || time.minutes > 0 || time.seconds > 0) {
      try {
        const currentTime = time;
        await WriteTimeLog(currentTime, hourlyRate);
        setTotalTime(prev => {
          const totalSeconds = (prev.hours * 3600 + prev.minutes * 60 + prev.seconds) +
            (currentTime.hours * 3600 + currentTime.minutes * 60 + currentTime.seconds);
          return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
          };
        });
        setTime({ hours: 0, minutes: 0, seconds: 0 });
      } catch (error) {
        console.error('Error al guardar el registro:', error);
      }
    }
    setBreakTime({ hours: 0, minutes: 0, seconds: 0 });
    setIsOnBreak(false);
  };

  const handleBreak = async () => {
    if (!isOnBreak) {
      try {
        var currentTime = time;
        await WriteTimeLog(currentTime, hourlyRate);

        setTotalTime(prev => {
          const totalSeconds = (prev.hours * 3600 + prev.minutes * 60 + prev.seconds) +
            (time.hours * 3600 + time.minutes * 60 + time.seconds);
          return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
          };
        });
      }
      catch (error) {
        console.error(error);
      }
    } else {

      setTotalBreakTime(prev => {
        const totalSeconds = (prev.hours * 3600 + prev.minutes * 60 + prev.seconds) +
          (breakTime.hours * 3600 + breakTime.minutes * 60 + breakTime.seconds);
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60
        };
      });
    }

    setIsOnBreak(!isOnBreak);
    setTime({ hours: 0, minutes: 0, seconds: 0 });
    setBreakTime({ hours: 0, minutes: 0, seconds: 0 });
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsOnBreak(false);
    setTime({ hours: 0, minutes: 0, seconds: 0 });
    setBreakTime({ hours: 0, minutes: 0, seconds: 0 });
    setTotalTime({ hours: 0, minutes: 0, seconds: 0 });
    setTotalBreakTime({ hours: 0, minutes: 0, seconds: 0 });
    setEarnings(0);
  };

  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value) || 0;
    setHourlyRate(newRate);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const formatTime = (val) => val.toString().padStart(2, '0');

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
      <div className={`w-full p-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDarkMode
              ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <h1 className={`text-2xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
          MoneyFlow
        </h1>

        {/* Hourly Rate Input */}
        <div className="relative mb-8">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
            <DollarSign className="w-4 h-4" />
            Tarifa por Hora
          </label>
          <input
            type="number"
            value={hourlyRate}
            onChange={handleRateChange}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400'
              : 'bg-white border-gray-200 text-gray-800 focus:border-blue-500'
              }`}
            step="0.01"
            min="0"
          />
        </div>

        {/* Earnings Display */}
        <div className={`rounded-xl p-6 mb-8 text-center ${isDarkMode
          ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}>
          <p className="text-blue-100 text-sm mb-1">Ganancias Actuales</p>
          <div className="text-white text-4xl font-bold">
            ${earnings.toFixed(2)}
          </div>
        </div>

        {/* Timer Display */}
        <div className={`rounded-xl p-6 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
          <div className={`flex flex-col items-center gap-2`}>
            <div className={`flex items-center justify-center gap-2 text-4xl font-mono font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
              <Clock className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              {isOnBreak ? (
                <span className="text-orange-500">
                  {formatTime(breakTime.hours)}:{formatTime(breakTime.minutes)}:{formatTime(breakTime.seconds)}
                </span>
              ) : (
                <span>
                  {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
                </span>
              )}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isOnBreak ? 'Tiempo de Break' : 'Tiempo Trabajado'}
            </div>
          </div>
        </div>

        {/* Total Times Display */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
            <p className={`text-center text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Tiempo Total Trabajado</p>
            <div className={`text-center text-lg font-mono font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
              {formatTime(totalTime.hours)}:{formatTime(totalTime.minutes)}:{formatTime(totalTime.seconds)}
            </div>
          </div>

          <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
            <p className={`text-center text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Tiempo Total de Break</p>
            <div className={`text-center text-lg font-mono font-bold text-orange-500`}>
              {formatTime(totalBreakTime.hours)}:{formatTime(totalBreakTime.minutes)}:{formatTime(totalBreakTime.seconds)}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Comenzar
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pausar
              </button>
              <button
                onClick={handleBreak}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${isOnBreak
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
              >
                <Coffee className="w-4 h-4" />
                {isOnBreak ? 'Finalizar Break' : 'Tomar Break'}
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EarningsCalculator;