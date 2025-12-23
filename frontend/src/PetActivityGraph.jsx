import React, { useEffect, useState } from 'react';
import './PetActivityGraph.css';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';

// Theme colors from tailwind.config.js and index.css
const theme = {
  red: '#C3001F', // main brand red
  redLight: '#ED1C24',
  grayBg: '#F3F4F6',
  grayBorder: '#E6E9EC',
  grayText: '#374151',
  white: '#fff',
};

// Helper: format time of day for Y axis
function formatTimeOfDay(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Props: activities = [{ timestamp, activityType: { name } }]
function PetActivityGraph({ activities, onHoverActivity, onClickActivity, onLeaveActivity }) {
  // Responsive: show 3 activities on mobile portrait, 5 otherwise
  const [activityLimit, setActivityLimit] = useState(5);
  useEffect(() => {
    function updateLimit() {
      // Use window.matchMedia to detect orientation and width
      if (window.matchMedia('(max-width: 640px) and (orientation: portrait)').matches) {
        setActivityLimit(3);
      } else {
        setActivityLimit(5);
      }
    }
    updateLimit();
    window.addEventListener('resize', updateLimit);
    window.addEventListener('orientationchange', updateLimit);
    return () => {
      window.removeEventListener('resize', updateLimit);
      window.removeEventListener('orientationchange', updateLimit);
    };
  }, []);
  // Conversational label logic
  const VERB_LABELS = {
    feeding: { past: 'FED', future: 'FUTURE FEEDING' },
    walk: { past: 'WALKED', future: 'FUTURE WALK' },
    play: { past: 'PLAYED', future: 'FUTURE PLAY' },
    medication: { past: 'MEDICATED', future: 'FUTURE MEDICATION' },
    water: { past: 'WATERED', future: 'FUTURE WATER' },
    grooming: { past: 'GROOMED', future: 'FUTURE GROOMING' },
    chilling: { past: 'CHILLED', future: 'FUTURE CHILL' },
    photo: { past: 'PHOTO TAKEN', future: 'FUTURE PHOTO' },
    other: { past: 'ACTIVITY', future: 'FUTURE ACTIVITY' }
  };
  const now = new Date();
  // Add horizontal jitter for same-day activities
  const sortedActs = [...(activities || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-activityLimit);
  // Group by date string
  const dateGroups = {};
  sortedActs.forEach((a, i) => {
    const d = new Date(a.timestamp).toLocaleDateString();
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(i);
  });
  const data = sortedActs.map((a, i) => {
    const when = new Date(a.timestamp);
    const isFuture = when > now;
    const raw = a.activityType?.name ? a.activityType.name.toLowerCase() : '';
    let label = '';
    if (raw) {
      const verb = VERB_LABELS[raw] || VERB_LABELS[Object.keys(VERB_LABELS).find(k => raw.includes(k))] || null;
      if (verb) {
        label = isFuture ? verb.future : verb.past;
      } else {
        label = isFuture ? `FUTURE ${raw.toUpperCase()}` : `${raw.toUpperCase()}ED`;
      }
    }
    // Jitter: if multiple on same day, offset x by a small amount
    const dateStr = when.toLocaleDateString();
    const group = dateGroups[dateStr];
    let jitter = 0;
    if (group && group.length > 1) {
      const idx = group.indexOf(i);
      // Spread jitter in [-0.18, 0.18] range for up to 3 points, less for 2
      const spread = 0.18;
      if (group.length === 2) {
        jitter = idx === 0 ? -spread : spread;
      } else {
        jitter = spread * (idx - (group.length - 1) / 2);
      }
    }
    return {
      x: when.toLocaleDateString(),
      xJitter: jitter,
      y: when.getHours() + when.getMinutes() / 60,
      label,
      time: formatTimeOfDay(a.timestamp),
      id: a.id || i,
      rawActivity: a,
    };
  });

  // Animation state: how many points/segments to show
  // Show all data statically

  return (
    <div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Activity Timeline</h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[400px] sm:min-w-0" style={{ minWidth: '400px' }}>
            <ResponsiveContainer width="100%" height={320}>
          <ScatterChart
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            style={{ background: theme.grayBg }}
          >
            <CartesianGrid stroke={theme.grayBorder} strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="category"
              name="Date"
              tick={{ fill: theme.grayText, fontWeight: 500, className: 'pet-activity-graph-axis-label' }}
              axisLine={{ stroke: theme.grayBorder }}
              tickLine={{ stroke: theme.grayBorder }}
              interval="preserveStartEnd"
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, 24]}
              name="Time of Day"
              tickFormatter={h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`}
              tick={{ fill: theme.grayText, fontWeight: 500, className: 'pet-activity-graph-axis-label' }}
              axisLine={{ stroke: theme.grayBorder }}
              tickLine={{ stroke: theme.grayBorder }}
            />
            {/* Tooltip disabled — we handle hover with the modal instead */}
            <Scatter
              name="Activity"
              data={data}
              fill={theme.red}
              line={{ stroke: theme.grayText, strokeWidth: 2 }}
              isAnimationActive={false}
              shape={props => {
                // Apply jitter to cx and cy if present
                const xJitter = props.payload?.xJitter || 0;
                const cx = props.cx + (props.width ? props.width * xJitter : 0);
                // For vertical jitter, y is already adjusted in data.y
                const activity = props.payload?.rawActivity || null;
                return (
                  <g style={{ transform: 'translate(0,0)' }}>
                    <circle
                      cx={cx}
                      cy={props.cy}
                      r={6}
                      className="activity-dot-pulse"
                      fill={theme.red}
                      style={{ transformOrigin: `${cx}px ${props.cy}px`, cursor: 'pointer' }}
                      onMouseEnter={() => { if (onHoverActivity && activity) onHoverActivity(activity); }}
                      onMouseLeave={() => { if (onLeaveActivity) onLeaveActivity(activity); }}
                      onClick={() => { if (onClickActivity && activity) onClickActivity(activity); }}
                    />
                  </g>
                );
              }}
            >
              <LabelList
                dataKey="label"
                position="top"
                offset={16}
                fill={theme.grayText}
                fontWeight={700}
                className="pet-activity-graph-label"
              />
            </Scatter>
          </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Last {activityLimit} activities by date and time of day.
          {activityLimit === 3 && typeof window !== 'undefined' && window.matchMedia('(max-width: 640px) and (orientation: portrait)').matches && (
            <span> (change to landscape orientation to see more)</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PetActivityGraph;
