import React, { useEffect, useState, useRef } from 'react';
import { Filter, ChevronDown, Search, X, SlidersHorizontal } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { userService, departmentService } from '../../services/taskService';
import { WORK_CATEGORY, LEAD_DEPT, STATUS_CONFIG, DEPUTY_DIRECTORS, MONTHS, YEARS } from '../../utils/constants';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function FilterBar({ showMonth = true }) {
  const { filters, setFilters, fetchTree, fetchKanban } = useTaskStore();
  const [users,      setUsers]      = useState([]);
  const [apiDepts,   setApiDepts]   = useState([]);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
    departmentService.getAll().then(r => setApiDepts(r.data.data || [])).catch(() => {});

    // Refresh khi có bộ phận mới
    const handleUpdate = () => {
      departmentService.getAll().then(r => setApiDepts(r.data.data || [])).catch(() => {});
    };
    window.addEventListener('departments-updated', handleUpdate);
    return () => window.removeEventListener('departments-updated', handleUpdate);
  }, []);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const update = (newFilters) => setFilters(newFilters);

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: val });
      setTimeout(() => { fetchTree(); fetchKanban(); }, 0);
    }, 350);
  };

  const clearSearch = () => {
    setLocalSearch('');
    setFilters({ search: '' });
    setTimeout(() => { fetchTree(); fetchKanban(); }, 0);
  };

  const hasFilter = filters.workCategory || filters.leadDepartment || filters.deputyDirector || filters.status || filters.assigneeId;

  // Build dept list: merge LEAD_DEPT cố định + departments từ API
  const deptEntries = (() => {
    const merged = { ...LEAD_DEPT };
    apiDepts.forEach(d => {
      const key = `LD-${d.code}`;
      if (!merged[key]) {
        merged[key] = { label: d.name, short: key, color: d.color || '#6366f1' };
      }
    });
    return Object.entries(merged).map(([k, v]) => ({ key: k, label: v.label, color: v.color }));
  })();

  // ── Select component ──────────────────────────────────────
  const Sel = ({ value, onChange, children, width = 130, label }) => (
    <div style={{ position: 'relative', width: isMobile ? '100%' : width }}>
      {isMobile && label && (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', appearance: 'none',
          fontSize: isMobile ? 14 : 12, borderRadius: 8,
          paddingLeft: 10, paddingRight: 26,
          paddingTop: isMobile ? 10 : 5, paddingBottom: isMobile ? 10 : 5,
          border: '1.5px solid var(--border)', cursor: 'pointer',
          backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', outline: 'none',
        }}
      >
        {children}
      </select>
      <ChevronDown size={11} style={{
        position: 'absolute', right: 8,
        top: isMobile && label ? 'calc(50% + 10px)' : '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)'
      }} />
    </div>
  );

  // ── Search box ────────────────────────────────────────────
  const SearchBox = () => (
    <div style={{
      position: 'relative',
      width: isMobile ? '100%' : undefined,
      minWidth: isMobile ? undefined : 220,
      maxWidth: isMobile ? undefined : 320,
      marginLeft: isMobile ? 0 : 'auto',
    }}>
      <Search size={14} style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        color: localSearch ? '#0ea5e9' : 'var(--text-muted)', pointerEvents: 'none',
      }} />
      <input
        type="text"
        placeholder="Tìm kiếm công việc..."
        value={localSearch}
        onChange={e => handleSearchChange(e.target.value)}
        style={{
          width: '100%', paddingLeft: 32, paddingRight: localSearch ? 30 : 12,
          paddingTop: isMobile ? 10 : 6, paddingBottom: isMobile ? 10 : 6,
          fontSize: isMobile ? 14 : 12, borderRadius: 9,
          border: `1.5px solid ${localSearch ? '#0ea5e9' : 'var(--border)'}`,
          backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
          outline: 'none', boxSizing: 'border-box',
          boxShadow: localSearch ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
        }}
      />
      {localSearch && (
        <button onClick={clearSearch} style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', padding: 2,
        }}>
          <X size={13} />
        </button>
      )}
    </div>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}><SearchBox /></div>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              backgroundColor: (showFilters || hasFilter) ? '#0ea5e9' : 'var(--bg-hover)',
              color: (showFilters || hasFilter) ? '#fff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 700, flexShrink: 0, position: 'relative',
            }}
          >
            <SlidersHorizontal size={15} />
            Lọc
            {hasFilter && <span style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />}
          </button>
        </div>

        {showMonth && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Sel value={filters.month} onChange={v => update({ month: parseInt(v) })} width={120}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </Sel>
            <Sel value={filters.year} onChange={v => update({ year: parseInt(v) })} width={80}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </Sel>
          </div>
        )}

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Sel value={filters.leadDepartment} onChange={v => update({ leadDepartment: v })} label="Bộ phận">
              <option value="">Tất cả bộ phận</option>
              {deptEntries.map(d => <option key={d.key} value={d.key}>{d.key}</option>)}
            </Sel>
            <Sel value={filters.assigneeId} onChange={v => update({ assigneeId: v })} label="Người thực hiện">
              <option value="">Tất cả người TH</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Sel>
            <Sel value={filters.deputyDirector} onChange={v => update({ deputyDirector: v })} label="Lãnh đạo">
              <option value="">Tất cả lãnh đạo</option>
              {DEPUTY_DIRECTORS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Sel>
            <Sel value={filters.workCategory} onChange={v => update({ workCategory: v })} label="Loại CV">
              <option value="">Tất cả loại CV</option>
              {Object.entries(WORK_CATEGORY).map(([k, v]) => <option key={k} value={k}>{k}</option>)}
            </Sel>
            <Sel value={filters.status} onChange={v => update({ status: v })} label="Trạng thái">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Sel>
            {hasFilter && (
              <button
                onClick={() => { update({ workCategory: '', leadDepartment: '', deputyDirector: '', status: '', assigneeId: '' }); setShowFilters(false); }}
                style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <X size={13} /> Xóa lọc
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
        <Filter size={13} />
        <span style={{ fontWeight: 700 }}>Lọc:</span>
      </div>

      {showMonth && (
        <>
          <Sel value={filters.month} onChange={v => update({ month: parseInt(v) })} width={120}>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </Sel>
          <Sel value={filters.year} onChange={v => update({ year: parseInt(v) })} width={80}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Sel>
          <div style={{ width: 1, height: 18, backgroundColor: 'var(--border)', margin: '0 2px' }} />
        </>
      )}

      {/* Bộ phận — từ API */}
      <Sel value={filters.leadDepartment} onChange={v => update({ leadDepartment: v })} width={160}>
        <option value="">Tất cả bộ phận</option>
        {deptEntries.map(d => (
          <option key={d.key} value={d.key}>{d.key} – {d.label}</option>
        ))}
      </Sel>

      <Sel value={filters.assigneeId} onChange={v => update({ assigneeId: v })} width={155}>
        <option value="">Tất cả người thực hiện</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Sel>

      <Sel value={filters.deputyDirector} onChange={v => update({ deputyDirector: v })} width={155}>
        <option value="">Tất cả lãnh đạo</option>
        {DEPUTY_DIRECTORS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </Sel>

      <Sel value={filters.workCategory} onChange={v => update({ workCategory: v })} width={120}>
        <option value="">Tất cả loại CV</option>
        {Object.entries(WORK_CATEGORY).map(([k, v]) => (
          <option key={k} value={k}>{k} – {v.label.split('–')[1]?.trim() || k}</option>
        ))}
      </Sel>

      <Sel value={filters.status} onChange={v => update({ status: v })} width={140}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </Sel>

      {hasFilter && (
        <button
          onClick={() => update({ workCategory: '', leadDepartment: '', deputyDirector: '', status: '', assigneeId: '' })}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          ✕ Xóa lọc
        </button>
      )}

      <SearchBox />
    </div>
  );
}
