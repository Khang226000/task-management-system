import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image,
  File,
  Film,
  Loader2
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function FileIcon({ mimetype, size = 20 }) {
  if (!mimetype) return <File size={size} style={{ color: '#64748b' }} />;
  if (mimetype.startsWith('image/')) return <Image size={size} style={{ color: '#0ea5e9' }} />;
  if (mimetype === 'application/pdf') return <FileText size={size} style={{ color: '#ef4444' }} />;
  if (mimetype.includes('word')) return <FileText size={size} style={{ color: '#2563eb' }} />;
  if (mimetype.includes('excel') || mimetype.includes('sheet')) return <FileText size={size} style={{ color: '#16a34a' }} />;
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return <FileText size={size} style={{ color: '#ea580c' }} />;
  if (mimetype.startsWith('video/')) return <Film size={size} style={{ color: '#8b5cf6' }} />;
  return <File size={size} style={{ color: '#64748b' }} />;
}

// ── Modal xem trước file ──
function PreviewModal({ file, onClose }) {
  const fileUrl = `${BASE_URL}${file.url}`;
  const isImage = file.mimetype?.startsWith('image/');
  const isPdf   = file.mimetype === 'application/pdf';
  const isVideo = file.mimetype?.startsWith('video/');

  // URL download với tên gốc
  const downloadUrl = `${BASE_URL}/api/upload/download/${file.filename}?name=${encodeURIComponent(file.originalName)}`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', maxWidth: 900, marginBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
        padding: '10px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileIcon mimetype={file.mimetype} size={18} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', maxWidth: 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.originalName}
          </span>
          {file.size && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {formatBytes(file.size)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={downloadUrl}
            download={file.originalName}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 7,
              backgroundColor: 'rgba(14,165,233,0.2)', color: '#0ea5e9',
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
              border: '1px solid rgba(14,165,233,0.3)',
            }}
          >
            <Download size={13} /> Tải xuống
          </a>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 7,
              backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}
          >
            <ExternalLink size={13} /> Mở tab mới
          </a>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
              cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div style={{
        width: '100%', maxWidth: 900,
        maxHeight: 'calc(90vh - 80px)',
        borderRadius: 12, overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isImage && (
          <img
            src={fileUrl}
            alt={file.originalName}
            style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 80px)', objectFit: 'contain' }}
          />
        )}
        {isPdf && (
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            title={file.originalName}
            style={{ width: '100%', height: 'calc(90vh - 80px)', border: 'none' }}
          />
        )}
        {isVideo && (
          <video
            src={fileUrl}
            controls
            style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 80px)' }}
          />
        )}
        {!isImage && !isPdf && !isVideo && (
          <div style={{
            padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)',
          }}>
            <FileIcon mimetype={file.mimetype} size={48} />
            <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600 }}>
              Không thể xem trước loại file này
            </p>
            <p style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>
              {file.originalName}
            </p>
            <a
              href={downloadUrl}
              download={file.originalName}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 16, padding: '10px 20px', borderRadius: 8,
                backgroundColor: '#0ea5e9', color: '#fff',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <Download size={14} /> Tải xuống để xem
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Component hiển thị danh sách file đính kèm ──
export default function FileAttachmentList({ attachments = [], compact = false, onDelete }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [downloading, setDownloading] = useState(null);

  if (!attachments || attachments.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
        Chưa có tài liệu đính kèm
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {attachments.map((f, i) => {
          const fileUrl = `${BASE_URL}${f.url}`;
          const downloadUrl = `${BASE_URL}/api/upload/download/${f.filename}?name=${encodeURIComponent(f.originalName)}`;
          const isImage = f.mimetype?.startsWith('image/');
          const isPdf   = f.mimetype === 'application/pdf';
          const canPreview = isImage || isPdf || f.mimetype?.startsWith('video/');

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: compact ? '6px 10px' : '8px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            >
              <div
                onClick={() => canPreview && setPreviewFile(f)}
                style={{ cursor: canPreview ? 'pointer' : 'default', flexShrink: 0 }}
                title={canPreview ? 'Click để xem trước' : ''}
              >
                {isImage ? (
                  <img
                    src={fileUrl}
                    alt={f.originalName}
                    style={{
                      width: compact ? 32 : 40, height: compact ? 32 : 40,
                      borderRadius: 6, objectFit: 'cover',
                      border: '1px solid var(--border)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: compact ? 32 : 40, height: compact ? 32 : 40,
                    borderRadius: 6, backgroundColor: 'var(--bg-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)',
                  }}>
                    <FileIcon mimetype={f.mimetype} size={compact ? 16 : 20} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  onClick={() => canPreview && setPreviewFile(f)}
                  style={{
                    fontSize: compact ? 11 : 12, fontWeight: 700,
                    color: canPreview ? '#0ea5e9' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    cursor: canPreview ? 'pointer' : 'default',
                    textDecoration: canPreview ? 'underline' : 'none',
                  }}
                  title={canPreview ? 'Click để xem trước' : f.originalName}
                >
                  {f.originalName}
                </div>
                {!compact && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatBytes(f.size)}
                    {f.uploadedAt && ` · ${new Date(f.uploadedAt).toLocaleDateString('vi-VN')}`}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {canPreview && (
                  <button
                    onClick={() => setPreviewFile(f)}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: 'none',
                      backgroundColor: 'rgba(14,165,233,0.12)', color: '#0ea5e9',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    👁 Xem
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      setDownloading(f.filename);
                      const token = localStorage.getItem('token');
                      const response = await fetch(downloadUrl, {
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });

                      if (!response.ok) throw new Error('Download failed');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = f.originalName;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                      
                      setTimeout(() => alert('✅ File đã tải xuống'), 500);
                    } catch (err) {
                      alert('❌ Không tải được file');
                    } finally {
                      setDownloading(null);
                    }
                  }}
                  style={{
                    padding: '4px 8px', borderRadius: 6,
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
                    border: '1px solid var(--border)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                  title={`Tải xuống: ${f.originalName}`}
                >
                  {downloading === f.filename ? (
                    <><Loader2 size={11} className="animate-spin" /> Đang tải...</>
                  ) : (
                    <><Download size={11} /> Tải</>
                  )}
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(f.filename)}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: 'none',
                      backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <X size={12}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}
