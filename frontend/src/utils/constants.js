// ── Work Category ──
export const WORK_CATEGORY = {
  COM: { label: 'COM – Truyền thông', short: 'COM', color: '#6366f1', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  CON: { label: 'CON – Nội dung',     short: 'CON', color: '#ec4899', bg: 'bg-pink-500/20',   text: 'text-pink-400' },
  ADM: { label: 'ADM – Hành chính',   short: 'ADM', color: '#f59e0b', bg: 'bg-amber-500/20',  text: 'text-amber-400' },
  TEC: { label: 'TEC – Kỹ thuật',     short: 'TEC', color: '#14b8a6', bg: 'bg-teal-500/20',   text: 'text-teal-400' },
  LOG: { label: 'LOG – Hậu cần',      short: 'LOG', color: '#10b981', bg: 'bg-emerald-500/20',text: 'text-emerald-400' }
};

// ── Lead Department ──
export const LEAD_DEPT = {
  'LD-INNO': { label: 'KN&DMST',                short: 'LD-INNO', color: '#ef4444' },
  'LD-ADM':  { label: 'Hành chính tổng hợp',    short: 'LD-ADM',  color: '#f59e0b' },
  'LD-INF':  { label: 'Thông tin thống kê',      short: 'LD-INF',  color: '#8b5cf6' },
  'LD-SER':  { label: 'Dịch vụ',                 short: 'LD-SER',  color: '#10b981' },
  'LD-BOD':  { label: 'Ban Giám đốc',            short: 'LD-BOD',  color: '#0ea5e9' },
  'LD-COM':  { label: 'Hành chính tổng hợp',     short: 'LD-COM',  color: '#6366f1' },
};

/**
 * Build LEAD_DEPT từ danh sách departments lấy từ API
 * Dùng khi cần map code -> label/color
 */
export function buildLeadDept(departments = []) {
  if (!departments.length) return LEAD_DEPT;
  const result = {};
  departments.forEach(d => {
    const key = `LD-${d.code}`;
    result[key] = { label: d.name, short: key, color: d.color || '#6366f1' };
  });
  return result;
}

// ── Status — màu đồng nhất toàn hệ thống ──
export const STATUS_CONFIG = {
  not_started: {
    label: 'Chưa bắt đầu',
    color: '#64748b',
    dot: '#94a3b8',
    bgHex: 'rgba(100,116,139,0.18)',
    textHex: '#94a3b8',
    bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-400/40'
  },
  in_progress: {
    label: 'Đang thực hiện',
    color: '#f59e0b',
    dot: '#fbbf24',
    bgHex: 'rgba(245,158,11,0.18)',
    textHex: '#fbbf24',
    bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-400/40'
  },
    review: {
    label: 'Đang review',
    color: '#8b5cf6',
    dot: '#a78bfa',
    bgHex: 'rgba(139,92,246,0.18)',
    textHex: '#a78bfa',
    bg: 'bg-violet-500/20',
    text: 'text-violet-400',
    border: 'border-violet-400/40'
  },
  done: {
    label: 'Hoàn thành',
    color: '#10b981',
    dot: '#34d399',
    bgHex: 'rgba(16,185,129,0.18)',
    textHex: '#34d399',
    bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-400/40'
  },
  delayed: {
    label: 'Trễ hạn',
    color: '#ef4444',
    dot: '#f87171',
    bgHex: 'rgba(239,68,68,0.18)',
    textHex: '#f87171',
    bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-400/40'
  }
};

// ── Completion ──
export const COMPLETION_CONFIG = {
  OT: { label: 'OT – Đúng hạn',       color: '#10b981', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  OD: { label: 'OD – Trễ hạn',        color: '#f59e0b', bg: 'bg-amber-500/20',   text: 'text-amber-400' },
  IC: { label: 'IC – Không hoàn thành',color: '#ef4444', bg: 'bg-red-500/20',     text: 'text-red-400' }
};

// ── Task Type ──
export const TASK_TYPE = {
  R: { label: 'R – Routine',  desc: 'Công việc bình thường', color: '#6366f1', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  A: { label: 'A – Ad-hoc',   desc: 'Công việc phát sinh',   color: '#f97316', bg: 'bg-orange-500/20', text: 'text-orange-400' }
};

// ── Deputy Directors ──
export const DEPUTY_DIRECTORS = [
  { value: 'GĐ-Hải',    label: 'GĐ Nguyễn Minh Hải' },
  { value: 'PGĐ-Khanh', label: 'PGĐ Trần Thị Khanh' },
  { value: 'PGĐ-Điền',  label: 'PGĐ Lê Văn Điền' },
  { value: 'PGĐ-Vụ',    label: 'PGĐ Phạm Quốc Vụ' }
];

export const MONTHS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'
];

// ── Event types (dùng cho lịch trình) ──
export const EVENT_TYPE_CONFIG = {
  meeting:  { label: 'Họp',       color: '#6366f1' },
  deadline: { label: 'Deadline',  color: '#ef4444' },
  holiday:  { label: 'Nghỉ lễ',   color: '#f59e0b' },
  reminder: { label: 'Nhắc nhở',  color: '#10b981' },
  other:    { label: 'Khác',      color: '#6b7280' }
};

// ── Danh sách năm — từ 2026 đến 2100 ──
export const YEARS = Array.from({ length: 2100 - 2026 + 1 }, (_, i) => 2026 + i);
