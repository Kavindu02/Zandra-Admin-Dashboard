import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PlaneLanding,
  PlaneTakeoff,
  TrendingUp,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CUSTOMERS_FLIGHTS_API = `${API_BASE_URL}/api/customersflights`;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const toDateAtMidnight = (value) => {
  const parsed = new Date(value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const parseLocalDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return toDateAtMidnight(value);
  }

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, monthIndex, day);
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateAtMidnight(parsed);
};

const pickTravelerName = (record) =>
  String(
    record.passenger ||
      record.traveler ||
      record.traveller ||
      record.name ||
      record.customerName ||
      'Unknown Traveler',
  ).trim();

const parseDateFromCompositeField = (value) => {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
  const compositeMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (compositeMatch) {
    return parseLocalDate(compositeMatch[1]);
  }

  return parseLocalDate(text);
};

const pickFirstDateFromKeys = (record, keys) => {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }

    const parsed = parseLocalDate(record[key]);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const pickFirstDateFromCompositeKeys = (record, keys) => {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }

    const parsed = parseDateFromCompositeField(record[key]);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const isSameMonth = (left, right) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

const isSameDate = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export default function FlightCalendar() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateAtMidnight(now));
  const [flightRows, setFlightRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let isFirstLoad = true;

    const fetchFlightRows = async () => {
      if (isFirstLoad && isMounted) {
        setIsLoading(true);
      }

      try {
        const res = await axios.get(CUSTOMERS_FLIGHTS_API);
        if (!isMounted) {
          return;
        }

        const records = Array.isArray(res.data) ? res.data : [];
        setFlightRows(records);
        setLoadError('');
        setLastSyncedAt(new Date());
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError('Failed to sync live flight data. Showing the latest available view.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isFirstLoad = false;
      }
    };

    fetchFlightRows();

    const intervalId = setInterval(fetchFlightRows, 30000);
    const handleWindowFocus = () => fetchFlightRows();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFlightRows();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const flights = useMemo(() => {
    const mapped = [];

    flightRows.forEach((record, index) => {
      const traveler = pickTravelerName(record);

      const getCode = (str) => {
        if (!str) return '---';
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : String(str).substring(0, 3).toUpperCase();
      };

      let segs = [];
      try {
        if (record.segments) {
          segs = typeof record.segments === 'string' ? JSON.parse(record.segments) : record.segments;
        }
      } catch (e) {}
      if (!Array.isArray(segs)) segs = [];

      let retSegs = [];
      try {
        if (record.returnSegments) {
          retSegs = typeof record.returnSegments === 'string' ? JSON.parse(record.returnSegments) : record.returnSegments;
        }
      } catch (e) {}
      if (!Array.isArray(retSegs)) retSegs = [];

      // Clean empty segments
      const outbound = segs.filter(s => s && (s.from || s.to));
      const inbound = retSegs.filter(s => s && (s.from || s.to));

      let finalOutbound = outbound;
      let finalInbound = inbound;

      // Logic: If inbound is empty but outbound has multiple segments, try splitting
      if (finalInbound.length === 0 && finalOutbound.length > 1) {
        const startCode = getCode(finalOutbound[0].from);
        const endCode = getCode(finalOutbound[finalOutbound.length - 1].to);
        const isRoundTripType = record.tripType === 'Round Trip' || record.trip_type === 'Round Trip';
        
        if ((startCode === endCode && startCode !== '---') || isRoundTripType) {
          const mid = Math.floor(finalOutbound.length / 2);
          finalInbound = finalOutbound.slice(mid);
          finalOutbound = finalOutbound.slice(0, mid);
        }
      }

      // 1. Departure Date
      let departureDay = null;
      if (finalOutbound.length > 0 && finalOutbound[0].departureDate) {
        departureDay = parseLocalDate(finalOutbound[0].departureDate);
      }
      if (!departureDay) {
        departureDay = pickFirstDateFromKeys(record, ['departureDate', 'departure_date', 'travelDate', 'date']) ||
                       pickFirstDateFromCompositeKeys(record, ['departure', 'outbound']);
      }

      if (departureDay) {
        mapped.push({
          id: `${record.id ?? index}-dep`,
          traveler,
          type: 'departure',
          day: departureDay,
        });
      }

      // 2. Return Date
      let returnDay = null;
      // Try first segment of inbound list
      if (finalInbound.length > 0 && finalInbound[0].departureDate) {
        returnDay = parseLocalDate(finalInbound[0].departureDate);
      }
      
      // Fallback to explicit returnDate field
      if (!returnDay) {
        returnDay = pickFirstDateFromKeys(record, ['returnDate', 'return_date', 'arrivalDate', 'returnDepartureDate']) ||
                    pickFirstDateFromCompositeKeys(record, ['return', 'arrival', 'inbound']);
      }

      // If still no return date but it is a Round Trip, try taking the very last segment's date as a final guess
      if (!returnDay && (record.tripType === 'Round Trip' || record.trip_type === 'Round Trip') && finalInbound.length > 0) {
          // If we split it, finalInbound[0] should have had a date. If not, try any segment in finalInbound.
          for(const s of finalInbound) {
              const d = parseLocalDate(s.departureDate || s.arrivalDate);
              if (d) { returnDay = d; break; }
          }
      }

      if (returnDay) {
        mapped.push({
          id: `${record.id ?? index}-ret`,
          traveler,
          type: 'return',
          day: returnDay,
        });
      }
    });

    mapped.sort((left, right) => left.day.getTime() - right.day.getTime());
    return mapped;
  }, [flightRows]);

  const monthFlights = useMemo(
    () => flights.filter((flight) => isSameMonth(flight.day, currentMonth)),
    [flights, currentMonth],
  );

  const departuresThisMonth = monthFlights.filter((flight) => flight.type === 'departure').length;
  const returnsThisMonth = monthFlights.filter((flight) => flight.type === 'return').length;

  const departuresNext7Days = useMemo(() => {
    const today = toDateAtMidnight(new Date());
    const end = new Date(today);
    end.setDate(end.getDate() + 7);

    return flights.filter(
      (flight) => flight.type === 'departure' && flight.day >= today && flight.day <= end,
    ).length;
  }, [flights]);

  const busiestDayInfo = useMemo(() => {
    const counts = monthFlights.reduce((acc, flight) => {
      const key = flight.day.toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(counts);
    if (!entries.length) {
      return { dayLabel: '--', count: 0 };
    }

    const [busiestKey, count] = entries.sort((a, b) => b[1] - a[1])[0];
    const busiestDate = toDateAtMidnight(busiestKey);
    return {
      dayLabel: `${MONTH_LABELS[busiestDate.getMonth()].slice(0, 3)} ${busiestDate.getDate()}`,
      count,
    };
  }, [monthFlights]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { key: `empty-${index}`, date: null, events: [] };
      }

      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
      const events = monthFlights.filter((flight) => isSameDate(flight.day, date));
      return {
        key: `${date.toISOString()}-${index}`,
        date,
        events,
      };
    });
  }, [currentMonth, monthFlights]);

  const moveMonth = (offset) => {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
  };

  const stats = [
    {
      title: 'Departures this month',
      value: departuresThisMonth,
      hint: 'Scheduled outbound flights',
      icon: PlaneTakeoff,
      cardClass: 'bg-[#edf4ff] border-[#d6e5ff]',
      valueClass: 'text-[#365fc5]',
    },
    {
      title: 'Returns this month',
      value: returnsThisMonth,
      hint: 'Expected inbound flights',
      icon: PlaneLanding,
      cardClass: 'bg-[#ecfbf3] border-[#cdeedc]',
      valueClass: 'text-[#2a8f63]',
    },
    {
      title: 'Departures next 7 days',
      value: departuresNext7Days,
      hint: 'Upcoming departures',
      icon: Clock3,
      cardClass: 'bg-[#fff9e9] border-[#f1e4b7]',
      valueClass: 'text-[#ab7a16]',
    },
    {
      title: 'Busiest travel day',
      value: busiestDayInfo.dayLabel,
      hint: `${busiestDayInfo.count} flights`,
      icon: TrendingUp,
      cardClass: 'bg-[#f7f1ff] border-[#e4d8ff]',
      valueClass: 'text-[#7446d6]',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Flight Calendar</h2>
          <TopHeaderActions />
        </div>

        <div className="p-6 md:p-8">
          <div className="max-w-[1300px] mx-auto space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {stats.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-4 shadow-sm ${item.cardClass}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 font-semibold">{item.title}</p>
                    <item.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className={`text-2xl font-bold mt-3 ${item.valueClass}`}>{item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.hint}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="text-3xl font-extrabold text-[#101D42] tracking-tight">
                  {MONTH_LABELS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {DAY_LABELS.map((label) => (
                      <div
                        key={label}
                        className="text-center text-sm font-semibold text-gray-500 py-2"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarCells.map((cell) => {
                      if (!cell.date) {
                        return (
                          <div
                            key={cell.key}
                            className="min-h-[88px] rounded-xl border border-transparent"
                          />
                        );
                      }

                      const isSelected = isSameDate(cell.date, selectedDate);

                      return (
                        <button
                          type="button"
                          key={cell.key}
                          onClick={() => setSelectedDate(cell.date)}
                          className={`min-h-[88px] rounded-xl border p-2 text-left transition-all ${
                            isSelected
                              ? 'border-[#304878] shadow-[0_0_0_1px_rgba(48,72,120,0.4)]'
                              : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-700 mb-2">{cell.date.getDate()}</p>

                          <div className="space-y-1">
                            {cell.events.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold flex items-center gap-1.5 ${
                                  event.type === 'departure'
                                    ? 'bg-[#dbeafe] text-[#2250bb]'
                                    : 'bg-[#d6f5e6] text-[#16805a]'
                                }`}
                              >
                                {event.type === 'departure' ? (
                                  <PlaneTakeoff className="w-3 h-3" />
                                ) : (
                                  <PlaneLanding className="w-3 h-3" />
                                )}
                                <span className="truncate">{event.traveler}</span>
                              </div>
                            ))}

                            {cell.events.length > 2 && (
                              <p className="text-[10px] text-gray-500 font-semibold px-1">
                                +{cell.events.length - 2} more
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#dbeafe] border border-[#b8d3ff]" />
                <span className="inline-flex items-center gap-1">
                  <PlaneTakeoff className="w-3 h-3 text-[#2250bb]" />
                  Departure
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#d6f5e6] border border-[#a9e7cc]" />
                <span className="inline-flex items-center gap-1">
                  <PlaneLanding className="w-3 h-3 text-[#16805a]" />
                  Return
                </span>
              </div>

              <div className="ml-auto hidden md:flex items-center gap-2 text-gray-400">
                <CalendarDays className="w-4 h-4" />
                Click a day to focus flight entries
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}