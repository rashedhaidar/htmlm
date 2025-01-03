import React, { useState, useEffect, useContext } from 'react';
    import { Plus, Bell, Trash2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
    import { Activity } from '../types/activity';
    import { LIFE_DOMAINS } from '../types/domains';
    import { ActivityProgress } from './ActivityProgress';
    import { WeekSelector } from './WeekSelector';
    import { useWeekSelection } from '../hooks/useWeekSelection';
    import { DAYS } from '../constants/days';
    import { WeekDisplay } from './WeekDisplay';
    import { getDateOfWeek, getCurrentWeekDates, formatDate } from '../utils/dateUtils';
    import { ActivityForm } from './ActivityForm';
    import { ActivityContext } from '../context/ActivityContext';

    interface WeeklyScheduleProps {
      activities: Activity[];
      onToggleReminder: (activityId: string, dayIndex: number) => void;
      onEditActivity: (id: string, updates: Partial<Activity>) => void;
      onDeleteActivity: (id: string) => void;
    }

    export function WeeklySchedule({ 
      activities, 
      onToggleReminder,
      onEditActivity,
      onDeleteActivity,
    }: WeeklyScheduleProps) {
      const { selectedDate, weekNumber, year, changeWeek } = useWeekSelection();
      const [selectedDay, setSelectedDay] = useState<number | null>(null);
      const [showConfirmation, setShowConfirmation] = useState(false);
      const [activityToDelete, setActivityToDelete] = useState<{id: string, dayIndex: number | null} | null>(null);
      const [hoveredDay, setHoveredDay] = useState<number | null>(null); // Track hovered day
      const { addActivity, updateActivity } = useContext(ActivityContext);
      
      const weekStartDate = getDateOfWeek(weekNumber, year);
      const weekDates = getCurrentWeekDates(weekStartDate);
      
      const currentWeekActivities = activities.filter(activity => 
        activity.weekNumber === weekNumber && 
        activity.year === year
      );

      const handleAddActivity = (activity: Omit<Activity, 'id' | 'createdAt' | 'domainId'>) => {
        if (selectedDay !== null) {
          addActivity({
            ...activity,
            selectedDays: [selectedDay],
            weekNumber,
            year
          });
          setSelectedDay(null);
        }
      };

      const renderActivity = (activity: Activity, dayIndex: number) => {
        const isCompleted = activity.completedDays && activity.completedDays[dayIndex];
        return (
          <div
            className={`p-4 rounded-lg flex items-start justify-between group ${
              isCompleted
                ? 'bg-green-500/20 border-green-500/40' 
                : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20'
            }`}
          >
            <div>
              <h3 className="text-lg font-medium" dir="rtl">{activity.title}</h3>
              {activity.description && (
                <p className="text-sm opacity-70" dir="rtl">{activity.description}</p>
              )}
              {activity.reminder && (
                <div className="flex items-center gap-1 mt-2 text-sm text-white/70">
                  <Bell size={14} />
                  <span>{activity.reminder.time}</span>
                </div>
              )}
              {activity.targetCount !== undefined && (
                <ActivityProgress activity={activity} onUpdate={(updates) => onEditActivity(activity.id, updates)} />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditActivity(activity.id, {
                  completedDays: {
                    ...activity.completedDays,
                    [dayIndex]: !isCompleted,
                  }
                })}
                className={`p-2 rounded-full ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => {
                  setActivityToDelete({id: activity.id, dayIndex});
                  setShowConfirmation(true);
                }}
                className="p-2 rounded-full bg-red-400/20 text-red-400 hover:bg-red-400/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      };

      const renderDayContent = (dayIndex: number) => {
        const [positiveNotes, setPositiveNotes] = useState<string[]>(() => {
          const savedNotes = localStorage.getItem(`positiveNotes-${weekNumber}-${year}-${dayIndex}`);
          return savedNotes ? JSON.parse(savedNotes) : ['', '', '', '', ''];
        });
        const [freeWriting, setFreeWriting] = useState<string>(() => {
          return localStorage.getItem(`freeWriting-${weekNumber}-${year}-${dayIndex}`) || '';
        });
        const [isExpanded, setIsExpanded] = useState(false);

        useEffect(() => {
          localStorage.setItem(`positiveNotes-${weekNumber}-${year}-${dayIndex}`, JSON.stringify(positiveNotes));
        }, [positiveNotes, weekNumber, year, dayIndex]);

        useEffect(() => {
          localStorage.setItem(`freeWriting-${weekNumber}-${year}-${dayIndex}`, freeWriting);
        }, [freeWriting, weekNumber, year, dayIndex]);

        const handlePositiveNoteChange = (index: number, value: string) => {
          const newNotes = [...positiveNotes];
          newNotes[index] = value;
          setPositiveNotes(newNotes);
        };

        const toggleExpanded = () => {
          setIsExpanded(!isExpanded);
        };

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {currentWeekActivities
                .filter(activity => activity.selectedDays?.includes(dayIndex))
                .map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    {renderActivity(activity, dayIndex)}
                  </div>
                ))}
            </div>
            <button
              onClick={toggleExpanded}
              className="flex items-center gap-1 text-white/70 hover:text-white"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {isExpanded ? 'إخفاء' : 'إظهار'} الملاحظات والكتابة الحرة
            </button>
            {isExpanded && (
              <div className="space-y-2">
                <h4 className="text-white font-medium text-base" dir="rtl">
                  5 نقاط إيجابية
                </h4>
                <ul className="list-disc list-inside">
                  {positiveNotes.map((note, index) => (
                    <li key={index}>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => handlePositiveNoteChange(index, e.target.value)}
                        className="w-full p-1 rounded bg-black/20 border border-white/10 text-white text-sm"
                        dir="rtl"
                        placeholder={`نقطة ${index + 1}`}
                      />
                    </li>
                  ))}
                </ul>
                <h4 className="text-white font-medium text-base mt-2" dir="rtl">
                  كتابة حرة
                </h4>
                <textarea
                  value={freeWriting}
                  onChange={(e) => setFreeWriting(e.target.value)}
                  className="w-full p-2 rounded bg-black/20 border border-white/10 text-white text-sm"
                  dir="rtl"
                  rows={4}
                  placeholder="اكتب هنا أفكارك ومشاعرك"
                />
              </div>
            )}
          </div>
        );
      };

      const confirmDelete = () => {
        if (activityToDelete) {
          const { id } = activityToDelete;
          onDeleteActivity(id);
          setActivityToDelete(null);
          setShowConfirmation(false);
        }
      };

      const cancelDelete = () => {
        setActivityToDelete(null);
        setShowConfirmation(false);
      };

      return (
        <div className="space-y-6">
          <WeekSelector 
            currentDate={selectedDate}
            onWeekChange={changeWeek}
          />
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {DAYS.map((day, index) => (
                    <th key={day} className="p-3 text-white border border-white/20">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-between">
                          <span>{day}</span>
                          <button
                            onClick={() => setSelectedDay(index)}
                            className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="text-sm text-white/70">
                          {formatDate(weekDates[index])}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DAYS.map((_, dayIndex) => (
                    <td 
                      key={dayIndex} 
                      className={`p-3 border border-white/20 align-top ${hoveredDay !== null && hoveredDay !== dayIndex ? 'opacity-50 blur-sm' : ''}`}
                      onMouseEnter={() => setHoveredDay(dayIndex)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {selectedDay === dayIndex && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 p-6 rounded-lg w-full max-w-2xl relative">
                            <button
                              onClick={() => setSelectedDay(null)}
                              className="absolute top-4 right-4 text-white/70 hover:text-white"
                            >
                              <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-4 text-right">
                              إضافة نشاط ليوم {DAYS[dayIndex]}
                            </h2>
                            <ActivityForm
                              onSubmit={handleAddActivity}
                              weekNumber={weekNumber}
                              year={year}
                              initialDomainId={null}
                              hideDomainsSelect={false}
                              selectedDay={selectedDay}
                            />
                          </div>
                        </div>
                      )}
                      {renderDayContent(dayIndex)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {showConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg text-black">
                <p className="mb-4">هل أنت متأكد من أنك تريد إلغاء هذا النشاط؟</p>
                <div className="flex justify-end gap-4">
                  <button onClick={confirmDelete} className="bg-green-500 text-white p-2 rounded">
                    نعم
                  </button>
                  <button onClick={cancelDelete} className="bg-red-500 text-white p-2 rounded">
                    لا
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
