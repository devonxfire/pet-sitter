import React from 'react';
import './PetActivityGraph.css';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

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
function PetActivityGraph({ activities }) {
  // Last 5 activities, sorted by timestamp
  // Conversational label logic
  const VERB_LABELS = {
    feeding: { past: 'FED', future: 'FUTURE FEEDING' },
    walk: { past: 'WALKED', future: 'FUTURE WALK' },
    play: { past: 'PLAYED', future: 'FUTURE PLAY' },
    medication: { past: 'MEDICATED', future: 'FUTURE MEDICATION' },
    water: { past: 'WATERED', future: 'FUTURE WATER' },
    grooming: { past: 'GROOMED', future: 'FUTURE GROOMING' },
    photo: { past: 'PHOTO TAKEN', future: 'FUTURE PHOTO' },
    other: { past: 'ACTIVITY', future: 'FUTURE ACTIVITY' }
  };
  const now = new Date();
  const data = [...(activities || [])]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-5)
    .map((a, i) => {
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
      return {
        x: when.toLocaleDateString(),
        y: when.getHours() + when.getMinutes() / 60,
        label,
        time: formatTimeOfDay(a.timestamp),
        id: a.id || i,
      };
    });

  // Animation state: how many points/segments to show
  // Show all data statically

  return (
    <div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Activity Timeline</h3>
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
              tick={{ fill: theme.grayText, fontWeight: 500 }}
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
              tick={{ fill: theme.grayText, fontWeight: 500 }}
              axisLine={{ stroke: theme.grayBorder }}
              tickLine={{ stroke: theme.grayBorder }}
            />
            <Tooltip
              cursor={{ stroke: theme.redLight, strokeWidth: 2 }}
              contentStyle={{ background: theme.white, borderColor: theme.grayBorder, color: theme.grayText }}
              labelStyle={{ color: theme.red }}
              formatter={(value, name, props) => {
                if (name === 'y') {
                  const h = Math.floor(value);
                  const m = Math.round((value % 1) * 60);
                  return [`${h}:${String(m).padStart(2, '0')}`, 'Time'];
                }
                return [value, name];
              }}
            />
            <Scatter
              name="Activity"
              data={data}
              fill={theme.red}
              line={{ stroke: theme.grayText, strokeWidth: 2 }}
              isAnimationActive={false}
              shape={props => (
                <g style={{ transform: 'translate(0,0)' }}>
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    className="activity-dot-pulse"
                    fill={theme.red}
                    style={{ transformOrigin: `${props.cx}px ${props.cy}px` }}
                  />
                </g>
              )}
            >
              <LabelList
                dataKey="label"
                position="top"
                offset={16}
                fill={theme.grayText}
                fontWeight={700}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="text-sm text-gray-500 mt-2">Last 5 activities by date and time of day.</div>
      </div>
    </div>
  );
}

export default PetActivityGraph;
