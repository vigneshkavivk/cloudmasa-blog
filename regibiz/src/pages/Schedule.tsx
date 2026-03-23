import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Briefcase,
  Info,
  UserPlus
} from 'lucide-react';
import { UserProfile, ServiceDocument, UserRole } from '../types';
import { mockDbService } from '../services/mockFirebase';
import { getHolidaysForMonth, Holiday } from '../utils/holidays';

interface ScheduleProps {
  user: UserProfile;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Schedule: React.FC<ScheduleProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [docs, setDocs] = useState<ServiceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [timelineUsers, setTimelineUsers] = useState<UserProfile[]>([]);

  const isStaff = user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN;

  useEffect(() => {
    fetchDocuments();
    if (isStaff) fetchUserTimeline();
  }, [user.uid]);

  const fetchDocuments = async () => {
    try {
      const fetchedDocs = await mockDbService.getDocuments(user.uid);
      setDocs(fetchedDocs);
    } catch (error) {
      console.error("Failed to fetch schedule docs", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTimeline = async () => {
      try {
          const allUsers = await mockDbService.getAllUsers();
          const internal = allUsers.filter(u => u.role !== UserRole.CUSTOMER);
          setTimelineUsers(internal.sort((a,b) => b.createdAt - a.createdAt));
      } catch (e) {
          console.error(e);
      }
  };

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Data Merging
  const holidays = getHolidaysForMonth(year, month);
  
  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // 1. User Documents (Mapped by submittedAt or formData.dueDate if exists)
    const dayDocs = docs.filter(d => {
       const docDate = d.formData?.dueDate 
          ? new Date(d.formData.dueDate) 
          : new Date(d.submittedAt);
       return docDate.getFullYear() === year && 
              docDate.getMonth() === month && 
              docDate.getDate() === day;
    });

    // 2. Holidays
    const dayHoliday = holidays.find(h => h.date === dateStr);

    return {
      docs: dayDocs,
      holiday: dayHoliday,
      isToday: isCurrentMonth && today.getDate() === day
    };
  };

  // Generate Calendar Grid
  const renderCalendarDays = () => {
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return totalSlots.map((day, index) => {
      if (!day) return <div key={`blank-${index}`} className="bg-navy-900/30 border border-white/5 h-24 md:h-32"></div>;

      const { docs, holiday, isToday } = getEventsForDay(day);
      const hasEvents = docs.length > 0 || holiday;

      return (
        <div 
          key={day} 
          className={`relative border border-white/5 p-2 h-24 md:h-32 transition-colors group ${
            isToday ? 'bg-orange-500/5 border-orange-500/30' : 'bg-navy-900/30 hover:bg-white/5'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
              isToday ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400'
            }`}>
              {day}
            </span>
            {isToday && <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider hidden md:block">Today</span>}
          </div>

          {/* Events Stack */}
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] pr-1 custom-scrollbar">
            {holiday && (
              <div className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 truncate flex items-center gap-1" title={holiday.name}>
                 <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                 {holiday.name}
              </div>
            )}

            {docs.map(doc => (
               <div key={doc.id} className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1.5 ${
                 doc.status === 'approved' || doc.status === 'paid'
                   ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' 
                   : doc.status === 'processing' 
                   ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                   : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
               }`} title={doc.title}>
                 {doc.status === 'approved' || doc.status === 'paid' ? <CheckCircle size={8} /> : <Clock size={8} />}
                 {doc.title}
               </div>
            ))}
          </div>
        </div>
      );
    });
  };

  // Sidebar Summary Logic
  const upcomingEvents = docs.filter(d => {
    const dDate = new Date(d.submittedAt);
    return dDate.getFullYear() === year && dDate.getMonth() === month;
  }).sort((a,b) => b.submittedAt - a.submittedAt);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden animate-fade-in bg-[#020c1b]">
      
      {/* --- Main Calendar Area --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-navy-900/50 backdrop-blur-sm z-10">
           <div>
              <h2 className="text-2xl font-bold text-gradient-heading flex items-center gap-2">
                 Compliance Calendar
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                 {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
           </div>
           
           <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10">
              <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                 <ChevronLeft size={18} />
              </button>
              <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/10 rounded-md transition-colors border-x border-white/5 mx-1">
                 Today
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                 <ChevronRight size={18} />
              </button>
           </div>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-navy-800/30">
           {WEEKDAYS.map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                 {day}
              </div>
           ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto">
           <div className="grid grid-cols-7 auto-rows-fr">
              {renderCalendarDays()}
           </div>
           
           {/* Footer / Legend */}
           <div className="p-4 flex gap-4 text-xs text-gray-500 border-t border-white/5 bg-navy-900/50">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-orange-500"></span> Completed
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending/Processing
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-purple-500"></span> Public Holiday
              </div>
           </div>
        </div>
      </div>

      {/* --- Right Sidebar (Summary & Admin Timeline) --- */}
      <div className="w-full md:w-80 border-l border-white/5 bg-navy-900/50 backdrop-blur-md flex flex-col h-full z-20">
         <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-bold text-gradient-heading uppercase tracking-wider flex items-center gap-2">
               {isStaff ? 'Timeline & Activity' : 'My Activity'}
            </h3>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* ADMIN ONLY: Staff Onboarding Timeline */}
            {isStaff && timelineUsers.length > 0 && (
                <div className="mb-6 pb-6 border-b border-white/5">
                    <h4 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                        <UserPlus size={14} /> Team Onboarding
                    </h4>
                    <div className="space-y-4 relative pl-2">
                        <div className="absolute left-1.5 top-2 bottom-2 w-[1px] bg-white/10"></div>
                        {timelineUsers.map(u => (
                            <div key={u.uid} className="relative pl-6">
                                <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-[#020c1b] ${
                                    u.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}></div>
                                <p className="text-sm font-medium text-white">{u.displayName || u.email}</p>
                                <p className="text-[10px] text-gray-500 flex justify-between">
                                    <span className="uppercase">{u.role}</span>
                                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Holidays List */}
            {holidays.length > 0 && (
               <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">Holidays</h4>
                  {holidays.map((h, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-navy-900 rounded border border-white/10 text-purple-400">
                           <span className="text-[10px] uppercase font-bold">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                           <span className="text-sm font-bold leading-none">{new Date(h.date).getDate()}</span>
                        </div>
                        <div>
                           <p className="text-sm text-gray-200 font-medium">{h.name}</p>
                           <p className="text-xs text-gray-500 capitalize">{h.type}</p>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {/* Submissions List */}
            <div className="space-y-2">
               <h4 className="text-xs font-semibold text-gradient-heading mb-2 mt-4">Filings & Submissions</h4>
               {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                     <CalendarIcon size={24} className="mx-auto text-gray-600 mb-2" />
                     <p className="text-sm text-gray-400">No scheduled filings yet</p>
                     <p className="text-xs text-gray-500 mt-1">Submit a service to see it here.</p>
                  </div>
               ) : (
                  upcomingEvents.map(doc => (
                     <div key={doc.id} className="group flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                        <div className={`mt-0.5 ${
                           doc.status === 'approved' || doc.status === 'paid' ? 'text-orange-400' : 'text-amber-400'
                        }`}>
                           {doc.status === 'approved' || doc.status === 'paid' ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm text-gray-200 font-medium truncate">{doc.title}</p>
                           <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>{new Date(doc.submittedAt).toLocaleDateString()}</span>
                              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                              <span className="capitalize">{doc.status}</span>
                           </p>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Schedule;