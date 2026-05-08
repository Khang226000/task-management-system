import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import LoadingScreen from '../components/LoadingScreen';
import api from '../services/api';

export default function LoginPage() {
  const navigate    = useNavigate();
  const { login }   = useAuthStore();

  const [tab,      setTab]      = useState('login'); // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status,   setStatus]   = useState('idle'); // idle|loading|success|error
  const [message,  setMessage]  = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  // Register form
  const [regName,  setRegName]  = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass,  setRegPass]  = useState('');
  const [regMsg,   setRegMsg]   = useState('');
  const [regStatus,setRegStatus]= useState('idle');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading'); setMessage('');
    try {
      const user = await login(email, password);
      setStatus('success');
      setPendingRole(user.role);
      setShowLoading(true);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    }
  };

  const handleLoadingDone = () => {
    setShowLoading(false);
    if (pendingRole === 'member') navigate('/my-tasks');
    else navigate('/dashboard');
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '12px 16px',
    fontSize: 14, color: '#e0f2fe', outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <>
      {showLoading && <LoadingScreen onDone={handleLoadingDone}/>}

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b1929 0%, #0d2137 50%, #0b1929 100%)',
        padding: 16, position: 'relative', overflow: 'hidden'
      }}>
        {/* Background blobs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'20%', left:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.06), transparent 70%)' }}/>
          <div style={{ position:'absolute', bottom:'15%', right:'10%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.05), transparent 70%)' }}/>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
          backgroundColor: 'rgba(13,33,55,0.95)',
          border: '1px solid rgba(20,184,166,0.15)',
          borderRadius: 20,
          padding: '36px 32px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(20,184,166,0.08)'
        }}>

          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <Layers size={28} style={{ color: '#14b8a6' }}/>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#e0f2fe', margin: 0, letterSpacing: '-0.3px' }}>
                Quản lý Task
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', marginBottom:28, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key:'login',    label:'Đăng Nhập' },
              { key:'register', label:'Đăng Ký' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setStatus('idle'); setMessage(''); }}
                style={{
                  flex:1, padding:'10px 0', border:'none', background:'none', cursor:'pointer',
                  fontSize: 14, fontWeight: 700,
                  color: tab === t.key ? '#14b8a6' : 'rgba(255,255,255,0.35)',
                  borderBottom: tab === t.key ? '2px solid #14b8a6' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.2s'
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {status === 'error' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
                  <AlertCircle size={15} style={{ color:'#ef4444', flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:'#ef4444' }}>{message}</span>
                </div>
              )}

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>
                  Tên đăng nhập
                </label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); if(status==='error') setStatus('idle'); }}
                  placeholder="email@qlcv.vn" required disabled={status==='loading'}
                  style={{ ...inputStyle, ...(status==='error' ? { borderColor:'rgba(239,68,68,0.5)' } : {}) }}
                  onFocus={e => e.target.style.borderColor='rgba(20,184,166,0.6)'}
                  onBlur={e => e.target.style.borderColor=status==='error'?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.12)'}
                />
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>
                  Mật khẩu
                </label>
                <div style={{ position:'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); if(status==='error') setStatus('idle'); }}
                    placeholder="••••••••" required disabled={status==='loading'}
                    style={{ ...inputStyle, paddingRight:44, ...(status==='error' ? { borderColor:'rgba(239,68,68,0.5)' } : {}) }}
                    onFocus={e => e.target.style.borderColor='rgba(20,184,166,0.6)'}
                    onBlur={e => e.target.style.borderColor=status==='error'?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.12)'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} disabled={status==='loading'}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex', padding:0 }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={status==='loading'}
                style={{
                  width:'100%', padding:'13px', borderRadius:9, border:'none', marginTop:4,
                  background: status==='loading'
                    ? 'linear-gradient(135deg, rgba(20,184,166,0.6), rgba(13,148,136,0.6))'
                    : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  color:'#fff', fontSize:15, fontWeight:700,
                  cursor: status==='loading' ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: status==='loading' ? 'none' : '0 4px 20px rgba(20,184,166,0.35)',
                  transition:'all 0.2s'
                }}>
                {status === 'loading' ? (
                  <>
                    <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                    Đang đăng nhập...
                  </>
                ) : 'Đăng Nhập'}
              </button>

              {/* Quick login — chỉ điền email, không hiện mật khẩu */}
              <div style={{ marginTop:8, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  Đăng nhập nhanh
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {[
                    { email:'admin@qlcv.vn',  role:'Admin',      color:'#6366f1' },
                    { email:'hai@qlcv.vn',    role:'GĐ Hải',     color:'#10b981' },
                    { email:'khanh@qlcv.vn',  role:'PGĐ Khanh',  color:'#f59e0b' },
                    { email:'suong@qlcv.vn',  role:'Sương',      color:'#ec4899' },
                    { email:'nhu@qlcv.vn',    role:'Như',        color:'#14b8a6' },
                  ].map(acc => (
                    <button key={acc.email} type="button"
                      onClick={() => { setEmail(acc.email); setPassword(''); setStatus('idle'); setMessage(''); }}
                      disabled={status==='loading'}
                      style={{
                        display:'flex', alignItems:'center', gap:10, padding:'7px 10px',
                        borderRadius:8, border:'1px solid rgba(255,255,255,0.06)',
                        backgroundColor:'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'left',
                        transition:'background 0.15s', opacity: status==='loading' ? 0.5 : 1
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(20,184,166,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'}>
                      <div style={{ width:26, height:26, borderRadius:'50%', backgroundColor:acc.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff', flexShrink:0 }}>
                        {acc.role.charAt(0)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{acc.role}</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>{acc.email}</div>
                      </div>
                      <span style={{ fontSize:10, color:'rgba(20,184,166,0.6)', fontWeight:600 }}>Chọn →</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={async e => {
              e.preventDefault();
              setRegStatus('loading'); setRegMsg('');
              try {
                const { default: _api } = { default: api };
                await _api.post('/auth/register', { name: regName, email: regEmail, password: regPass });
                setRegStatus('success');
                setRegMsg('Đăng ký thành công! Vui lòng đăng nhập.');
                setTimeout(() => { setTab('login'); setEmail(regEmail); setRegStatus('idle'); }, 1500);
              } catch(err) {
                setRegStatus('error');
                setRegMsg(err.response?.data?.message || 'Đăng ký thất bại');
              }
            }} style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {regStatus === 'error' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
                  <AlertCircle size={15} style={{ color:'#ef4444', flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:'#ef4444' }}>{regMsg}</span>
                </div>
              )}
              {regStatus === 'success' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(20,184,166,0.1)', border:'1px solid rgba(20,184,166,0.25)' }}>
                  <CheckCircle size={15} style={{ color:'#14b8a6', flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:'#14b8a6' }}>{regMsg}</span>
                </div>
              )}

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>Họ tên</label>
                <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Nguyễn Văn A" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor='rgba(20,184,166,0.6)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="email@qlcv.vn" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor='rgba(20,184,166,0.6)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>Mật khẩu</label>
                <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="••••••••" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor='rgba(20,184,166,0.6)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
              </div>

              <button type="submit" disabled={regStatus==='loading'}
                style={{
                  width:'100%', padding:'13px', borderRadius:9, border:'none', marginTop:4,
                  background:'linear-gradient(135deg, #14b8a6, #0d9488)',
                  color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow:'0 4px 20px rgba(20,184,166,0.35)'
                }}>
                {regStatus === 'loading'
                  ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Đang đăng ký...</>
                  : 'Đăng Ký'
                }
              </button>
            </form>
          )}
        </div>

        <p style={{ position:'absolute', bottom:16, fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', width:'100%' }}>
          © 2024 Hệ thống Quản lý Công việc Nội bộ
        </p>
      </div>
    </>
  );
}
