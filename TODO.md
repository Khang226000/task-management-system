# TODO - Fix login đăng nhập không được

- [x] Tìm nguyên nhân: password bị hash 2 lần (controller + model hooks)
- [x] Sửa `backend/src/controllers/auth.controller.js`: gỡ hash khi register + changePassword, để hook ở model xử lý
- [x] Sửa indentation/comment cho đúng logic
- [ ] Chạy lại backend local và test flow:
  - [ ] register -> login đúng mật khẩu
  - [ ] login với admin seed (admin@qlcv.vn / Admin@2024) nếu cần
- [ ] Tạo/seed tài khoản admin trước khi deploy để có thể đăng nhập vào tab admin
- [ ] Deploy lại backend lên Render, sau đó verify frontend login trên Vercel


