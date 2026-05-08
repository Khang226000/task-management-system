# TODO - Deploy Vercel (fix failing)

## Mục tiêu
Deploy lại thành công trên Vercel sau khi bị lỗi build/runtime.

## Checklist
- [x] Lấy log failing từ Vercel bằng lệnh `npx vercel inspect ... --logs`
- [x] Sửa Project Settings trên Vercel: Root Directory đúng cho “full stack” (repo có subfolder `task-management-system-main/`)

- [ ] Cập nhật build/start (nếu Vercel hiện đang coi như frontend-only)
- [ ] Push commit mới (không chỉ force push y chang) để Vercel chạy lại pipeline
- [ ] Chờ deploy pass và kiểm tra URL/api health

